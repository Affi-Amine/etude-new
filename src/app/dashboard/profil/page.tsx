'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth';

export default function ProfilePage() {
  const { teacher, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: teacher?.firstName || '',
    lastName: teacher?.lastName || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    address: teacher?.address || '',
    bio: teacher?.bio || '',
    specialties: teacher?.specialties?.join(', ') || '',
    experience: teacher?.experience?.toString() || '',
    hourlyRate: teacher?.hourlyRate || 0,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (teacher) {
      const updatedTeacher = {
        ...teacher,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
        specialties: formData.specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
        experience: parseInt(formData.experience) || 0,
        hourlyRate: formData.hourlyRate
      };
      updateProfile(updatedTeacher);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (teacher) {
      setFormData({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phone: teacher.phone || '',
        address: teacher.address || '',
        bio: teacher.bio || '',
        specialties: teacher.specialties?.join(', ') || '',
        experience: teacher.experience?.toString() || '',
        hourlyRate: teacher.hourlyRate || 0,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    setIsEditing(false);
  };

  if (!teacher) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos informations personnelles et professionnelles
          </p>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Modifier le profil
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </span>
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50">
                      <Camera className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {teacher.firstName} {teacher.lastName}
                  </h3>
                  <p className="text-gray-600">{teacher.email}</p>
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Compte approuvé
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Membre depuis</span>
                <span className="font-medium">{new Date(teacher.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cours donnés</span>
                <span className="font-medium">127</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Étudiants actifs</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Note moyenne</span>
                <span className="font-medium">4.8/5</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Profile Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Vos informations de base et de contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarif horaire (TND)
                  </label>
                  <Input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                    placeholder="50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                  placeholder="Tunis, Tunisie"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations professionnelles</CardTitle>
              <CardDescription>
                Vos compétences et expérience d'enseignement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialités (séparées par des virgules)
                </label>
                <Input
                  value={formData.specialties}
                  onChange={(e) => handleInputChange('specialties', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                  placeholder="Mathématiques, Physique, Chimie"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Années d'expérience
                </label>
                <Input
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                  placeholder="5 ans d'expérience en enseignement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biographie
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${!isEditing ? 'bg-gray-50' : ''}`}
                  rows={4}
                  placeholder="Parlez-nous de votre parcours et de votre approche pédagogique..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>
                  Modifiez votre mot de passe (optionnel)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nouveau mot de passe
                    </label>
                    <Input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="Nouveau mot de passe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmer le mot de passe
                    </label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirmez le mot de passe"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}