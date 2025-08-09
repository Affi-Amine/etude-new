'use client'

import { motion } from 'framer-motion'
import { Calendar, Users, BarChart3, Bell, ArrowRight, CheckCircle, Star, GraduationCap, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Calendar,
    title: 'Planification',
    description: 'Organisez vos cours avec un calendrier intuitif et des rappels automatiques.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Users,
    title: 'Groupes d\'étudiants',
    description: 'Gérez facilement vos groupes et suivez les progrès de chaque étudiant.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: BarChart3,
    title: 'Analyses',
    description: 'Visualisez vos revenus, taux de présence et performances en temps réel.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Recevez des rappels personnalisés et gardez vos étudiants informés.',
    color: 'from-orange-500 to-red-500'
  }
]

const steps = [
  {
    number: '01',
    title: 'Inscrivez-vous',
    description: 'Créez votre compte en quelques minutes et attendez l\'approbation.'
  },
  {
    number: '02',
    title: 'Créez vos groupes',
    description: 'Organisez vos étudiants en groupes selon les matières et niveaux.'
  },
  {
    number: '03',
    title: 'Planifiez vos cours',
    description: 'Utilisez notre calendrier pour programmer et gérer vos sessions.'
  }
]

const testimonials = [
  {
    name: 'Amina Khelifi',
    role: 'Professeure de Mathématiques',
    school: 'Lycée Bourguiba, Tunis',
    content: 'Cette plateforme a révolutionné ma façon d\'enseigner. Je peux maintenant suivre facilement tous mes étudiants.',
    rating: 5
  },
  {
    name: 'Mohamed Trabelsi',
    role: 'Professeur de Physique',
    school: 'Institut Supérieur, Sfax',
    content: 'L\'interface est intuitive et les analyses m\'aident à améliorer mes méthodes d\'enseignement.',
    rating: 5
  },
  {
    name: 'Leila Ben Salem',
    role: 'Professeure de Français',
    school: 'Collège Ibn Khaldoun, Sousse',
    content: 'Excellent outil pour gérer mes groupes et communiquer avec les parents d\'élèves.',
    rating: 5
  }
]

const faqs = [
  {
    question: 'Comment créer un nouveau groupe d\'étudiants ?',
    answer: 'Rendez-vous dans la section "Groupes" de votre tableau de bord, cliquez sur "Créer un groupe" et remplissez les informations nécessaires.'
  },
  {
    question: 'Puis-je synchroniser avec Google Calendar ?',
    answer: 'Oui, notre plateforme offre une synchronisation bidirectionnelle avec Google Calendar pour une gestion optimale de votre emploi du temps.'
  },
  {
    question: 'Comment suivre les paiements des étudiants ?',
    answer: 'La section "Analyses" vous permet de suivre tous les paiements, générer des factures et voir vos revenus en temps réel.'
  },
  {
    question: 'Y a-t-il une application mobile ?',
    answer: 'Notre plateforme est entièrement responsive et fonctionne parfaitement sur tous les appareils mobiles via votre navigateur.'
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LP</span>
              </div>
              <span className="text-xl font-bold text-gray-900">LessonPro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/connexion">
                <Button variant="ghost">Se connecter</Button>
              </Link>
              <Link href="/auth/inscription">
                <Button className="btn-primary">Commencer</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              L'éducation
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> connectée</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Une plateforme complète qui connecte enseignants, étudiants et parents pour une expérience éducative moderne et collaborative.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Teacher Login */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                   <GraduationCap className="h-8 w-8 text-white" />
                 </div>
                 <h3 className="text-xl font-semibold text-white mb-2">Enseignants</h3>
                <p className="text-gray-200 text-sm mb-4">Gérez vos cours, étudiants et plannings</p>
                <div className="space-y-2">
                  <Link href="/auth/inscription">
                    <Button className="w-full bg-white text-indigo-600 hover:bg-gray-100">
                      S'inscrire
                    </Button>
                  </Link>
                  <Link href="/auth/connexion">
                    <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-indigo-600">
                      Se connecter
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Student Login */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                   <BookOpen className="h-8 w-8 text-white" />
                 </div>
                 <h3 className="text-xl font-semibold text-white mb-2">Étudiants</h3>
                <p className="text-gray-200 text-sm mb-4">Accédez à vos cours et suivez vos progrès</p>
                <div className="space-y-2">
                  <Link href="/student/login">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                      Accès étudiant
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-300 text-center">
                    Nouveau ? Utilisez le code d'invitation de votre professeur
                  </p>
                </div>
              </div>

              {/* Parent Access */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Parents</h3>
                <p className="text-gray-200 text-sm mb-4">Suivez les progrès de vos enfants</p>
                <div className="space-y-2">
                  <Link href="/parent/login">
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600">
                      Accès parent
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-300 text-center">
                     Demandez le code famille à votre enfant
                   </p>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Une plateforme pour tous
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des outils adaptés à chaque utilisateur : enseignants, étudiants et parents
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <Card className="card-hover border-0 shadow-lg">
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center text-gray-600">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche
            </h2>
            <p className="text-xl text-gray-600">
              Trois étapes simples pour commencer
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="text-center relative"
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full">
                    <ArrowRight className="h-6 w-6 text-indigo-300 mx-auto" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Ce que dit notre communauté
            </h2>
            <p className="text-xl text-gray-600">
              Rejoignez des centaines d'enseignants, étudiants et parents satisfaits
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                      <div className="text-sm text-indigo-600">{testimonial.school}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Prêt à rejoindre notre communauté éducative ?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Découvrez une nouvelle façon d'apprendre et d'enseigner ensemble
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/inscription">
                <Button className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-4">
                  Enseignants - Commencer
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/student/login">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600 text-lg px-8 py-4">
                  Étudiants - Se connecter
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LP</span>
                </div>
                <span className="text-xl font-bold">LessonPro</span>
              </div>
              <p className="text-gray-400">
                La plateforme éducative qui connecte enseignants, étudiants et parents.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Démo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conditions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LessonPro. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
