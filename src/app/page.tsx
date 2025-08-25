'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Calendar, Users, BarChart3, Bell, ArrowRight, CheckCircle, Star, GraduationCap, BookOpen, Sparkles, Zap, Shield, Globe, Play, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}



const stats = [
  { number: '10K+', label: 'Enseignants actifs', icon: GraduationCap },
  { number: '50K+', label: 'Étudiants connectés', icon: BookOpen },
  { number: '98%', label: 'Satisfaction client', icon: Star },
  { number: '24/7', label: 'Support disponible', icon: Shield }
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
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  useEffect(() => {
    setIsLoaded(true)
    
    if (typeof window !== 'undefined') {
      // GSAP animations for enhanced interactions
      gsap.fromTo('.hero-title', 
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.3 }
      )
      
      gsap.fromTo('.hero-subtitle', 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.6 }
      )
      
      gsap.fromTo('.hero-cta', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.9 }
      )

      // Floating animation for background elements
      gsap.to('.floating-element', {
        y: -20,
        duration: 3,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.5
      })

      // Scroll-triggered animations
      ScrollTrigger.batch('.animate-on-scroll', {
        onEnter: (elements) => {
          gsap.fromTo(elements, 
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1 }
          )
        },
        start: 'top 80%'
      })
    }
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* Tines-Inspired Minimalist Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute top-0 left-0 right-0 z-50 bg-transparent"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xl font-semibold text-white">
                LessonPro
              </span>
            </motion.div>
            

            
            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Link href="/auth/connexion">
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/10 hover:text-white border-0 text-sm font-medium"
                  >
                    Professeur
                  </Button>
                </Link>
                <span className="text-white/60">|</span>
                <Link href="/student/login">
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/10 hover:text-white border-0 text-sm font-medium"
                  >
                    Étudiant
                  </Button>
                </Link>
                <span className="text-white/60">|</span>
                <Link href="/parent/login">
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/10 hover:text-white border-0 text-sm font-medium"
                  >
                    Parent
                  </Button>
                </Link>
              </div>
              <Link href="/auth/inscription">
                <Button className="bg-white text-purple-600 hover:bg-gray-50 text-sm font-medium px-6 rounded-lg shadow-sm">
                  Commencer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Unified Hero Section */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden" style={{backgroundColor: '#64349A'}}>
        {/* Background Elements */}
        <div className="absolute inset-0">
          
          {/* Floating Geometric Shapes */}
          <motion.div 
            className="absolute top-20 left-10 w-20 h-20 bg-white/5 rounded-full blur-xl"
            animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-40 right-20 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl"
            animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-40 left-20 w-16 h-16 bg-indigo-400/10 rounded-full blur-xl"
            animate={{ y: [-15, 15, -15], x: [15, -15, 15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              {/* Badge */}

              
              {/* Main Headline */}
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="hero-title text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight"
              >
                Pour l'éducation
                <br />
                <span className="text-purple-200">que vous ne pouvez</span>
                <br />
                <span className="text-purple-300">compromettre</span>
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="hero-subtitle text-xl text-white/80 mb-10 leading-relaxed max-w-lg"
              >
                Créez et orchestrez des workflows éducatifs intelligents, sur la plateforme de sécurité et de confiance IT de référence.
              </motion.p>
              
              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="hero-cta flex flex-col sm:flex-row gap-4 mb-12"
              >
                <Link href="/auth/inscription">
                  <Button className="bg-white text-purple-700 hover:bg-gray-50 px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                    Commencer gratuitement
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button variant="outline" className="border-white/30 text-black hover:bg-white/10 hover:text-purple-700 hover:text-white px-8 py-3 text-lg font-semibold rounded-lg backdrop-blur-sm w-full sm:w-auto">
                    Voir la démo
                  </Button>
                </Link>
              </motion.div>
              
              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="flex flex-wrap items-center gap-8 text-white/60 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Sécurisé RGPD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>10K+ enseignants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>98% satisfaction</span>
                </div>
              </motion.div>
             </motion.div>
             
             {/* Right Content - Floating UI Mockups */}
             <motion.div
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.8, delay: 0.4 }}
               className="relative hidden lg:block"
             >
               {/* Main Dashboard Mockup */}
               <motion.div
                 initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                 animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                 transition={{ duration: 1, delay: 0.6 }}
                 className="relative bg-white rounded-2xl shadow-2xl p-6 transform perspective-1000 rotate-y-12"
               >
                 {/* Dashboard Header */}
                 <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center space-x-3">
                     <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                       <BarChart3 className="h-4 w-4 text-purple-600" />
                     </div>
                     <span className="font-semibold text-gray-900">Tableau de bord</span>
                   </div>
                   <div className="flex space-x-2">
                     <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                     <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                     <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                   </div>
                 </div>
                 
                 {/* Stats Cards */}
                 <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-purple-50 rounded-lg p-4">
                     <div className="text-2xl font-bold text-purple-600">156</div>
                     <div className="text-sm text-gray-600">Étudiants actifs</div>
                   </div>
                   <div className="bg-green-50 rounded-lg p-4">
                     <div className="text-2xl font-bold text-green-600">98%</div>
                     <div className="text-sm text-gray-600">Taux de réussite</div>
                   </div>
                 </div>
                 
                 {/* Chart Area */}
                 <div className="bg-gray-50 rounded-lg h-32 flex items-center justify-center mb-4">
                   <div className="flex items-end space-x-2">
                     <div className="w-4 h-16 bg-purple-300 rounded-t"></div>
                     <div className="w-4 h-20 bg-purple-400 rounded-t"></div>
                     <div className="w-4 h-12 bg-purple-300 rounded-t"></div>
                     <div className="w-4 h-24 bg-purple-500 rounded-t"></div>
                     <div className="w-4 h-18 bg-purple-400 rounded-t"></div>
                   </div>
                 </div>
                 
                 {/* Recent Activity */}
                 <div className="space-y-3">
                   <div className="flex items-center space-x-3">
                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                       <Users className="h-4 w-4 text-blue-600" />
                     </div>
                     <div className="flex-1">
                       <div className="text-sm font-medium text-gray-900">Nouveau cours créé</div>
                       <div className="text-xs text-gray-500">Mathématiques - Niveau 3ème</div>
                     </div>
                   </div>
                   <div className="flex items-center space-x-3">
                     <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                       <CheckCircle className="h-4 w-4 text-green-600" />
                     </div>
                     <div className="flex-1">
                       <div className="text-sm font-medium text-gray-900">Évaluation terminée</div>
                       <div className="text-xs text-gray-500">15 étudiants ont participé</div>
                     </div>
                   </div>
                 </div>
               </motion.div>
               
               {/* Floating Notification Card */}
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, delay: 1.2 }}
                 className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
               >
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                     <Bell className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <div className="text-sm font-semibold text-gray-900">Nouveau message</div>
                     <div className="text-xs text-gray-500">Parent d'élève</div>
                   </div>
                 </div>
               </motion.div>
               
               {/* Floating Calendar Widget */}
               <motion.div
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.8, delay: 1.4 }}
                 className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
               >
                 <div className="text-sm font-semibold text-gray-900 mb-2">Prochains cours</div>
                 <div className="space-y-2">
                   <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                     <span className="text-xs text-gray-600">14:00 - Physique</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                     <span className="text-xs text-gray-600">16:00 - Chimie</span>
                   </div>
                 </div>
               </motion.div>
             </motion.div>
           </div>
         </div>
       </section>

       {/* Company Logos Section */}
       <section className="py-8" style={{backgroundColor: '#64349A'}}>
         <div className="max-w-7xl mx-auto px-6 lg:px-8">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             className="text-center mb-12"
           >
             <p className="text-white/60 text-sm font-medium mb-8">Utilisé par les meilleures institutions éducatives</p>
             <div className="flex flex-wrap justify-center items-center gap-8">
               {/* Logo placeholders */}
               <div className="bg-white/20 rounded-xl px-8 py-4 shadow-lg backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                 <span className="text-white font-bold text-lg">UNIVERSITÉ</span>
               </div>
               <div className="bg-white/20 rounded-xl px-8 py-4 shadow-lg backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                 <span className="text-white font-bold text-lg">LYCÉE</span>
               </div>
               <div className="bg-white/20 rounded-xl px-8 py-4 shadow-lg backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                 <span className="text-white font-bold text-lg">COLLÈGE</span>
               </div>
               <div className="bg-white/20 rounded-xl px-8 py-4 shadow-lg backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                 <span className="text-white font-bold text-lg">INSTITUT</span>
               </div>
             </div>
           </motion.div>
         </div>
       </section>

      {/* Revolutionary Process Section */}
      <section className="py-8 relative overflow-hidden" style={{backgroundColor: '#64349A'}}>
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)] bg-[length:400%_400%]"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Zap className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-white font-medium text-sm">Processus simplifié</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Comment ça
              <span className="text-yellow-300"> fonctionne</span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Trois étapes simples pour révolutionner votre expérience éducative
            </p>
          </motion.div>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 transform -translate-y-1/2" />
            
            <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.2,
                    ease: 'easeOut'
                  }}
                  viewport={{ once: true }}
                  className="text-center group animate-on-scroll relative"
                >
                  <div className="relative mb-8">
                    {/* Main Number Container */}
                    <motion.div 
                      className="w-24 h-24 mx-auto bg-white rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 relative z-10"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className="text-3xl font-bold text-indigo-600">{step.number}</span>
                    </motion.div>
                    
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: index * 0.2 + 0.4 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4 group-hover:text-yellow-300 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                      {step.description}
                    </p>
                  </motion.div>
                  
                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 + 0.6 }}
                      viewport={{ once: true }}
                      className="hidden lg:block absolute top-12 -right-8 text-white/50"
                    >
                      <ArrowRight className="h-6 w-6" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <Link href="/auth/inscription">
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg px-10 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                Commencer maintenant
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Revolutionary Testimonials Section */}
      <section className="py-8 relative overflow-hidden" style={{backgroundColor: '#64349A'}}>
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full filter blur-xl animate-pulse" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-white/5 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-white/5 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '4s' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Star className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-white font-medium text-sm">Témoignages authentiques</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ce que dit notre
              <span className="text-yellow-300"> communauté</span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Rejoignez des milliers d'enseignants, étudiants et parents qui transforment leur expérience éducative
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  ease: 'easeOut'
                }}
                viewport={{ once: true }}
                className="group animate-on-scroll"
              >
                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm hover:bg-white group-hover:scale-105 relative overflow-hidden">
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-[1px] bg-white rounded-lg" />
                  
                  <CardContent className="p-8 relative z-10">
                    {/* Rating Stars */}
                    <motion.div 
                      className="flex mb-6 justify-center"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: index * 0.15 + 0.3 }}
                      viewport={{ once: true }}
                    >
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, rotate: -180 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          transition={{ 
                            delay: index * 0.15 + 0.4 + (i * 0.1),
                            duration: 0.5,
                            ease: 'easeOut'
                          }}
                          viewport={{ once: true }}
                        >
                          <Star className="h-6 w-6 text-yellow-400 fill-current mx-0.5" />
                        </motion.div>
                      ))}
                    </motion.div>
                    
                    {/* Quote */}
                     <motion.div
                       initial={{ opacity: 0 }}
                       whileInView={{ opacity: 1 }}
                       transition={{ delay: index * 0.15 + 0.5 }}
                       viewport={{ once: true }}
                       className="relative mb-8"
                     >
                       <div className="text-6xl text-indigo-200 font-serif absolute -top-4 -left-2">"</div>
                       <p className="text-gray-700 text-lg leading-relaxed italic group-hover:text-gray-800 transition-colors relative z-10">
                         {testimonial.content}
                       </p>
                       <div className="text-6xl text-indigo-200 font-serif absolute -bottom-8 -right-2">"</div>
                     </motion.div>
                     
                     {/* Author Info */}
                     <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.15 + 0.7 }}
                       viewport={{ once: true }}
                       className="text-center"
                     >
                       <div className="w-16 h-16 mx-auto mb-4 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                         {testimonial.name.charAt(0)}
                       </div>
                       <div className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                         {testimonial.name}
                       </div>
                       <div className="text-gray-600 font-medium">{testimonial.role}</div>
                       <div className="text-indigo-600 text-sm font-medium">{testimonial.school}</div>
                     </motion.div>
                   </CardContent>
                 </Card>
               </motion.div>
             ))}
           </div>
           
           {/* Call to Action */}
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.6 }}
             viewport={{ once: true }}
             className="text-center mt-20"
           >
             <Link href="/auth/inscription">
               <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                 Rejoindre la communauté
                 <Star className="ml-2 h-5 w-5" />
               </Button>
             </Link>
           </motion.div>
         </div>
       </section>

      {/* Revolutionary FAQ Section */}
       <section className="py-8 relative overflow-hidden" style={{backgroundColor: '#64349A'}}>
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(71,85,105,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(100,116,139,0.1),transparent_50%)]" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <CheckCircle className="h-4 w-4 text-white/80 mr-2" />
              <span className="text-white/80 font-medium text-sm">Support complet</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Questions
              <span className="text-purple-200"> fréquentes</span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Trouvez rapidement les réponses à toutes vos questions
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => {
              const [isOpen, setIsOpen] = useState(false)
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="animate-on-scroll"
                >
                  <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-md hover:bg-white/90 transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      <motion.button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full p-6 lg:p-8 text-left flex items-center justify-between group"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h3 className="text-lg lg:text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors pr-4">
                          {faq.question}
                        </h3>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0"
                        >
                          <ChevronDown className="h-6 w-6 text-slate-600" />
                        </motion.div>
                      </motion.button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 lg:px-8 pb-6 lg:pb-8">
                              <div className="h-px bg-slate-300/40 mb-6" />
                              <p className="text-slate-600 text-lg leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
          
          {/* Support CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <p className="text-gray-300 text-lg mb-6">
              Vous ne trouvez pas la réponse à votre question ?
            </p>
            <Link href="/contact">
              <Button className="bg-slate-600 hover:bg-slate-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                Contactez notre support
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
       <section className="relative py-8 overflow-hidden" style={{backgroundColor: '#64349A'}}>
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(71,85,105,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(100,116,139,0.1),transparent_50%)]" />
        </div>
        
        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-slate-300/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-24 h-24 bg-slate-400/20 rounded-full blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Rejoignez plus de 60K+ utilisateurs
            </motion.div>
            
            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl lg:text-5xl font-bold text-white mb-6"
            >
              Prêt à <span className="text-purple-200">révolutionner</span> votre enseignement ?
            </motion.h2>
            
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Découvrez une nouvelle façon d'apprendre et d'enseigner avec notre plateforme innovante
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/auth/inscription">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-slate-900 text-white hover:bg-slate-800 text-lg px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group">
                    Enseignants - Commencer
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
              <Link href="/student/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" className="border-2 border-white/30 text-black hover:bg-white/10 hover:text-white text-lg px-8 py-4 rounded-xl font-semibold backdrop-blur-sm transition-all duration-300">
                    Étudiants - Se connecter
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            
            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center justify-center gap-8 mt-12 text-gray-400 text-sm"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Sécurisé RGPD</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>98% Satisfaction</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Support 24/7</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
       <footer className="relative text-white py-8 overflow-hidden" style={{backgroundColor: '#64349A'}}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(71,85,105,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(100,116,139,0.1),transparent_50%)]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-4 gap-8 mb-12"
          >
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="md:col-span-1"
            >
              <div className="flex items-center space-x-2 mb-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <span className="text-white font-bold text-lg">LP</span>
                </motion.div>
                <span className="text-2xl font-bold text-white">LessonPro</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                La plateforme éducative qui connecte enseignants, étudiants et parents dans un écosystème d'apprentissage moderne.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {[1, 2, 3, 4].map((item) => (
                  <motion.a
                    key={item}
                    href="#"
                    whileHover={{ scale: 1.2, y: -2 }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-300"
                  >
                    <div className="w-5 h-5 bg-white/60 rounded" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
            
            {/* Product Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className="font-semibold text-lg mb-6 text-white">Produit</h3>
              <ul className="space-y-3">
                {['Fonctionnalités', 'Tarifs', 'Démo', 'Intégrations'].map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  >
                    <motion.a
                      href="#"
                      whileHover={{ x: 4 }}
                      className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group"
                    >
                      <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* Support Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="font-semibold text-lg mb-6 text-white">Support</h3>
              <ul className="space-y-3">
                {['Centre d\'aide', 'Contact', 'FAQ', 'Communauté'].map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  >
                    <motion.a
                      href="#"
                      whileHover={{ x: 4 }}
                      className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group"
                    >
                      <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* Legal Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="font-semibold text-lg mb-6 text-white">Légal</h3>
              <ul className="space-y-3">
                {['Confidentialité', 'Conditions', 'Cookies', 'RGPD'].map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  >
                    <motion.a
                      href="#"
                      whileHover={{ x: 4 }}
                      className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group"
                    >
                      <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
          
          {/* Bottom Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-center md:text-left">
                &copy; 2024 LessonPro. Tous droits réservés. Fait avec ❤️ pour l'éducation.
              </p>
              
              {/* Trust Badges */}
              <div className="flex items-center space-x-6 text-gray-400 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Sécurisé</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>RGPD</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Certifié</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
