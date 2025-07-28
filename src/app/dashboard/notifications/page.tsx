'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare, Clock, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  timing: {
    immediate: boolean;
    oneHour: boolean;
    twelveHours: boolean;
    twentyFourHours: boolean;
  };
}

export default function NotificationsPage() {
  const { teacher } = useAuthStore();
  const [saved, setSaved] = useState(false);
  
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'lesson-reminders',
      title: 'Rappels de cours',
      description: 'Notifications avant le début des cours',
      icon: <Clock className="h-5 w-5" />,
      channels: { email: true, sms: false, push: true },
      timing: { immediate: false, oneHour: true, twelveHours: false, twentyFourHours: true }
    },
    {
      id: 'student-absence',
      title: 'Absences d\'étudiants',
      description: 'Notifications quand un étudiant est absent',
      icon: <Bell className="h-5 w-5" />,
      channels: { email: true, sms: false, push: true },
      timing: { immediate: true, oneHour: false, twelveHours: false, twentyFourHours: false }
    },
    {
      id: 'payment-reminders',
      title: 'Rappels de paiement',
      description: 'Notifications pour les paiements en retard',
      icon: <Mail className="h-5 w-5" />,
      channels: { email: true, sms: true, push: false },
      timing: { immediate: false, oneHour: false, twelveHours: false, twentyFourHours: true }
    },
    {
      id: 'new-messages',
      title: 'Nouveaux messages',
      description: 'Notifications pour les messages des étudiants',
      icon: <MessageSquare className="h-5 w-5" />,
      channels: { email: false, sms: false, push: true },
      timing: { immediate: true, oneHour: false, twelveHours: false, twentyFourHours: false }
    }
  ]);

  const updateChannelSetting = (settingId: string, channel: keyof NotificationSetting['channels'], value: boolean) => {
    setSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, channels: { ...setting.channels, [channel]: value } }
        : setting
    ));
  };

  const updateTimingSetting = (settingId: string, timing: keyof NotificationSetting['timing'], value: boolean) => {
    setSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, timing: { ...setting.timing, [timing]: value } }
        : setting
    ));
  };

  const handleSave = () => {
    // Here you would typically save to your backend
    console.log('Saving notification settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-gray-600 mt-2">
            Configurez vos préférences de notification pour rester informé(e)
          </p>
        </div>
        <Button 
          onClick={handleSave}
          className={`px-6 py-2 transition-all duration-300 ${
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

      {/* Notification Settings */}
      <div className="space-y-6">
        {settings.map((setting, index) => (
          <motion.div
            key={setting.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {setting.icon}
                  </div>
                  {setting.title}
                </CardTitle>
                <CardDescription>{setting.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Channels */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Canaux de notification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.channels.email}
                        onChange={(e) => updateChannelSetting(setting.id, 'email', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.channels.sms}
                        onChange={(e) => updateChannelSetting(setting.id, 'sms', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">SMS</span>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.channels.push}
                        onChange={(e) => updateChannelSetting(setting.id, 'push', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Push</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Timing */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Délais de notification</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.timing.immediate}
                        onChange={(e) => updateTimingSetting(setting.id, 'immediate', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Immédiat</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.timing.oneHour}
                        onChange={(e) => updateTimingSetting(setting.id, 'oneHour', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">1 heure avant</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.timing.twelveHours}
                        onChange={(e) => updateTimingSetting(setting.id, 'twelveHours', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">12 heures avant</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.timing.twentyFourHours}
                        onChange={(e) => updateTimingSetting(setting.id, 'twentyFourHours', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">24 heures avant</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Global Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Paramètres globaux</CardTitle>
            <CardDescription>
              Configurez les paramètres généraux de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Mode silencieux</h4>
                <p className="text-sm text-gray-600">Désactiver toutes les notifications entre 22h et 7h</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Grouper les notifications</h4>
                <p className="text-sm text-gray-600">Regrouper les notifications similaires</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}