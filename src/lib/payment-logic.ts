import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PaymentCycleData {
  studentId: string;
  groupId: string;
  attendedSessions: number;
  totalSessionsInCycle: number;
  currentStatus: 'EN_ATTENTE' | 'EN_RETARD' | 'A_JOUR';
  amountDue: number;
  nextDueDate?: Date;
}

/**
 * Calcule le statut de paiement d'un étudiant basé sur ses présences
 */
export async function calculateStudentPaymentStatus(
  studentId: string,
  groupId: string
): Promise<PaymentCycleData> {
  console.log(`Calculating payment status for student ${studentId} in group ${groupId}`);
  
  // Récupérer les informations du groupe
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      sessionFee: true,
      paymentThreshold: true,
      monthlyFee: true,
    },
  });

  // Déterminer le seuil et les frais de session avec fallback sur monthlyFee
  const paymentThreshold = group?.paymentThreshold || 8;
  let sessionFee: number | undefined = group?.sessionFee ?? undefined;
  if ((!sessionFee || sessionFee <= 0) && group?.monthlyFee && paymentThreshold > 0) {
    sessionFee = group.monthlyFee / paymentThreshold;
  }

  if (!group || !paymentThreshold || !sessionFee) {
    console.warn(`Configuration de paiement manquante pour le groupe ${groupId}`);
    // Return default status instead of throwing error
    return {
      studentId,
      groupId,
      attendedSessions: 0,
      totalSessionsInCycle: 0,
      currentStatus: 'A_JOUR',
      amountDue: 0,
      nextDueDate: undefined
    };
  }

  // Récupérer toutes les présences de l'étudiant pour ce groupe
  const attendances = await prisma.attendance.findMany({
    where: {
      studentId,
      session: {
        groupId,
      },
      status: 'PRESENT', // Seulement les présences
    },
    include: {
      session: {
        select: {
          date: true,
        },
      },
    },
    orderBy: {
      session: {
        date: 'asc',
      },
    },
  });

  // Récupérer tous les paiements de l'étudiant pour ce groupe
  const payments = await prisma.payment.findMany({
    where: {
      studentId,
      groupId,
      status: 'PAID',
    },
    orderBy: {
      paidDate: 'asc',
    },
  });

  const totalAttendedSessions = attendances.length;

  // Calculer combien de cycles de paiement ont été complétés
  const completedPaymentCycles = payments.length;
  
  // Calculer les sessions déjà payées (cycles complets * seuil)
  const paidSessions = completedPaymentCycles * paymentThreshold;
  
  // Sessions restantes à payer dans le cycle actuel
  const unpaidSessions = totalAttendedSessions - paidSessions;
  
  console.log(`Payment calculation details:`, {
    totalAttendedSessions,
    completedPaymentCycles,
    paidSessions,
    unpaidSessions,
    paymentThreshold,
    sessionFee
  });
  
  // Vérifier s'il existe des paiements en attente ou en retard
  const pendingPayments = await prisma.payment.findMany({
    where: {
      studentId,
      groupId,
      status: {
        in: ['PENDING', 'OVERDUE'],
      },
    },
  });

  // Déterminer le statut
  let currentStatus: 'EN_ATTENTE' | 'EN_RETARD' | 'A_JOUR';
  
  if (unpaidSessions === 0) {
    currentStatus = 'A_JOUR';
  } else if (unpaidSessions >= paymentThreshold) {
    // Si l'étudiant atteint le seuil, vérifier s'il y a déjà un paiement
    const overduePayment = pendingPayments.find(p => p.status === 'OVERDUE');
    const pendingPayment = pendingPayments.find(p => p.status === 'PENDING');
    
    if (overduePayment) {
      currentStatus = 'EN_RETARD';
    } else if (pendingPayment) {
      // Si un paiement PENDING existe depuis plus de 30 jours, le marquer comme OVERDUE
      const paymentAge = Date.now() - new Date(pendingPayment.dueDate).getTime();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      
      if (paymentAge > thirtyDaysInMs) {
        // Mettre à jour le paiement vers OVERDUE
        await prisma.payment.update({
          where: { id: pendingPayment.id },
          data: { status: 'OVERDUE' },
        });
        currentStatus = 'EN_RETARD';
      } else {
        currentStatus = 'EN_ATTENTE';
      }
    } else {
      // Aucun paiement existant, créer un paiement PENDING
      currentStatus = 'EN_ATTENTE';
    }
  } else {
    currentStatus = 'EN_ATTENTE';
  }

  // Calculer le montant dû basé sur les paiements en attente
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  
  console.log('Amount calculation:', {
    totalPendingAmount,
    unpaidSessions,
    sessionFee,
    calculatedAmount: unpaidSessions > 0 ? sessionFee * unpaidSessions : 0
  });
  
  const amountDue = totalPendingAmount > 0 ? totalPendingAmount : 
    (unpaidSessions > 0 ? sessionFee * unpaidSessions : 0);

  const result = {
    studentId,
    groupId,
    attendedSessions: totalAttendedSessions,
    totalSessionsInCycle: unpaidSessions,
    currentStatus,
    amountDue,
    nextDueDate: pendingPayments.length > 0 ? 
      new Date(Math.min(...pendingPayments.map(p => new Date(p.dueDate).getTime()))) : 
      (unpaidSessions >= paymentThreshold ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined),
  };
  
  console.log(`Final payment status result:`, result);
  
  return result;
}

/**
 * Crée automatiquement un paiement PENDING quand l'étudiant atteint le seuil
 */
export async function createPendingPaymentIfNeeded(
  studentId: string,
  groupId: string,
  teacherId: string
): Promise<boolean> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      sessionFee: true,
      paymentThreshold: true,
      monthlyFee: true,
    },
  });

  // Fallbacks
  const paymentThreshold = group?.paymentThreshold || 8;
  let sessionFee: number | undefined = group?.sessionFee ?? undefined;
  if ((!sessionFee || sessionFee <= 0) && group?.monthlyFee && paymentThreshold > 0) {
    sessionFee = group.monthlyFee / paymentThreshold;
  }

  if (!group || !paymentThreshold || !sessionFee) {
    return false;
  }

  // Récupérer les présences de l'étudiant
  const attendances = await prisma.attendance.findMany({
    where: {
      studentId,
      session: {
        groupId,
      },
      status: 'PRESENT',
    },
  });

  // Récupérer les paiements payés
  const paidPayments = await prisma.payment.findMany({
    where: {
      studentId,
      groupId,
      status: 'PAID',
    },
  });

  const totalAttendedSessions = attendances.length;
  const paidSessions = paidPayments.length * paymentThreshold;
  const unpaidSessions = totalAttendedSessions - paidSessions;

  // Si l'étudiant atteint le seuil et n'a pas de paiement en attente
  if (unpaidSessions >= paymentThreshold) {
    const existingPendingPayment = await prisma.payment.findFirst({
      where: {
        studentId,
        groupId,
        status: {
          in: ['PENDING', 'OVERDUE'],
        },
      },
    });

    if (!existingPendingPayment) {
      // Créer un nouveau paiement PENDING
      await prisma.payment.create({
        data: {
          studentId,
          groupId,
          teacherId,
          amount: sessionFee * paymentThreshold,
          type: 'SESSION_FEE',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          notes: `Paiement automatique - ${paymentThreshold} sessions`,
        },
      });
      return true;
    }
  }

  return false;
}

/**
 * Crée un paiement EN ATTENTE pour un étudiant qui vient de rejoindre
 */
export async function createInitialPendingPayment(
  studentId: string,
  groupId: string,
  teacherId: string
): Promise<void> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      sessionFee: true,
      paymentThreshold: true,
      monthlyFee: true,
    },
  });

  const paymentThreshold = group?.paymentThreshold || 8;
  let sessionFee: number | undefined = group?.sessionFee ?? undefined;
  if ((!sessionFee || sessionFee <= 0) && group?.monthlyFee && paymentThreshold > 0) {
    sessionFee = group.monthlyFee / paymentThreshold;
  }

  if (!group || !paymentThreshold || !sessionFee) {
    console.warn(`Configuration de paiement manquante pour le groupe ${groupId}`);
    return; // Skip payment creation for groups without proper config
  }

  // Vérifier s'il existe déjà un paiement pour cet étudiant
  const existingPayment = await prisma.payment.findFirst({
    where: {
      studentId,
      groupId,
    },
  });

  if (existingPayment) {
    return; // Paiement déjà existant
  }

  // Créer un paiement initial EN ATTENTE
  await prisma.payment.create({
    data: {
      studentId,
      groupId,
      teacherId,
      amount: sessionFee * paymentThreshold,
      type: 'SESSION_FEE',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      notes: `Paiement initial - ${paymentThreshold} sessions`,
    },
  });
}

/**
 * Met à jour tous les statuts de paiement pour un groupe
 */
export async function updateAllPaymentStatuses(groupId: string): Promise<void> {
  const groupStudents = await prisma.groupStudent.findMany({
    where: {
      groupId,
      isActive: true,
    },
    include: {
      student: true,
      group: true,
    },
  });

  for (const groupStudent of groupStudents) {
    await createPendingPaymentIfNeeded(
      groupStudent.studentId,
      groupId,
      groupStudent.teacherId
    );
  }
}

/**
 * Convertit le statut Prisma vers le format d'affichage
 */
export function mapPaymentStatusToDisplay(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'EN ATTENTE';
    case 'OVERDUE':
      return 'EN RETARD';
    case 'PAID':
      return 'À JOUR';
    default:
      return status;
  }
}

/**
 * Obtient la couleur CSS pour le statut de paiement
 */
export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'PAID':
    case 'À JOUR':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'PENDING':
    case 'EN ATTENTE':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'OVERDUE':
    case 'EN RETARD':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}