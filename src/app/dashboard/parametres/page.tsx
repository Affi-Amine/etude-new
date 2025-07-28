'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Moon, 
  Sun, 
  Monitor, 
  Shield, 
  Database, 
  Download, 
  Trash2, 
  AlertTriangle,
  Save,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';

export default function SettingsPage() {
  const { teacher } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    language: 'fr',
    theme: 'light',
    timezone: 'Africa/Tunis',
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24h',
    currency: 'TND',
    autoSave: true,
    emailNotifications: true,
    pushNotifications: true,
    dataBackup: true,
    analytics: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Here you would typically save to your backend
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleExportData = () => {
    // Export user data
    console.log('Exporting data...');
  };

  const handleDeleteAccount = () => {
    // Show confirmation dialog
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      console.log('Deleting account...');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-2">
            Configurez votre expérience sur la plateforme
          </p>
        </div>
        <Button 
          onClick={handleSave}
          className={`transition-all duration-300 ${
            saved ? 'bg-green-600 hover:bg-green-700' : ''
          }`}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Sauvegardé
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thème
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Clair', icon: Sun },
                    { value: 'dark', label: 'Sombre', icon: Moon },
                    { value: 'system', label: 'Système', icon: Monitor }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleSettingChange('theme', value)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        settings.theme === value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Regional Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Région et format
              </CardTitle>
              <CardDescription>
                Configurez les formats de date, heure et devise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuseau horaire
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Africa/Tunis">Tunis (GMT+1)</option>
                  <option value="Europe/Paris">Paris (GMT+1)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format de date
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format d'heure
                  </label>
                  <select
                    value={settings.timeFormat}
                    onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="24h">24 heures</option>
                    <option value="12h">12 heures (AM/PM)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TND">Dinar Tunisien (TND)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar US (USD)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Confidentialité et sécurité
              </CardTitle>
              <CardDescription>
                Gérez vos paramètres de confidentialité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Sauvegarde automatique</h4>
                  <p className="text-sm text-gray-600">Sauvegarder automatiquement vos données</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Collecte d'analytics</h4>
                  <p className="text-sm text-gray-600">Aider à améliorer la plateforme</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.analytics}
                    onChange={(e) => handleSettingChange('analytics', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestion des données
              </CardTitle>
              <CardDescription>
                Exportez ou supprimez vos données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-blue-900">Exporter mes données</h4>
                  <p className="text-sm text-blue-700">Téléchargez une copie de toutes vos données</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportData}
                  className="border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Supprimer mon compte
                  </h4>
                  <p className="text-sm text-red-700">Cette action est irréversible</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDeleteAccount}
                  className="border-red-200 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* System Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Informations système</CardTitle>
            <CardDescription>
              Détails sur votre compte et la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Version de la plateforme</h4>
                <p className="text-sm text-gray-600">v1.0.0</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Dernière connexion</h4>
                <p className="text-sm text-gray-600">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Stockage utilisé</h4>
                <p className="text-sm text-gray-600">2.3 MB / 100 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}