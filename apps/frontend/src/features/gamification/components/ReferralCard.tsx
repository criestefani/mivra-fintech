/**
 * ReferralCard Component
 * Displays user's referral code, share link, and referral statistics
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Share2, ExternalLink, Users, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { ReferralStats } from '@/hooks/useReferralData';

interface ReferralCardProps {
  stats: ReferralStats | null;
  isLoading: boolean;
  onCopyToClipboard: (text: string) => Promise<boolean>;
}

export function ReferralCard({ stats, isLoading, onCopyToClipboard }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!stats?.code) return;
    const success = await onCopyToClipboard(stats.code);
    if (success) {
      setCopied(true);
      toast.success('Código copiado! 📋');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Falha ao copiar');
    }
  };

  const handleCopyLink = async () => {
    if (!stats?.shareLink) return;
    const success = await onCopyToClipboard(stats.shareLink);
    if (success) {
      setCopied(true);
      toast.success('Link copiado! 🔗');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Falha ao copiar');
    }
  };

  const handleShare = async () => {
    if (!stats?.shareLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MivraTech - Bot de Trading',
          text: 'Junte-se a mim no MivraTech e ganhe 500 XP com seu primeiro depósito! 🚀',
          url: stats.shareLink,
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy link
      await handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div>
        <h3 className="text-sm md:text-base lg:text-lg font-bold text-white">Sistema de Referência 🎁</h3>
        <p className="text-xs text-slate-400 mt-1">
          Ganhe 500 XP cada vez que alguém se registra usando seu código e faz seu primeiro depósito
        </p>
      </div>

      {/* Referral Code Section */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="p-3 md:p-4 rounded-lg bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 border border-emerald-500/30"
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">Seu Código de Referência</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded bg-slate-900/50 text-sm font-mono text-emerald-400 break-all">
                {stats.code}
              </code>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyCode}
                className="p-2 rounded hover:bg-emerald-500/20 transition-colors"
                title="Copiar código"
              >
                <Copy className={`h-4 w-4 ${copied ? 'text-emerald-400' : 'text-slate-400'}`} />
              </motion.button>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-1">Link de Compartilhamento</p>
            <div className="flex items-center gap-2">
              <a
                href={stats.shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 rounded bg-slate-900/50 text-xs text-primary truncate hover:text-primary/80 transition-colors"
              >
                {stats.shareLink}
              </a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className="p-2 rounded hover:bg-emerald-500/20 transition-colors"
                title="Copiar link"
              >
                <Copy className={`h-4 w-4 ${copied ? 'text-emerald-400' : 'text-slate-400'}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-2 rounded hover:bg-primary/20 transition-colors"
                title="Compartilhar"
              >
                <Share2 className="h-4 w-4 text-slate-400" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {/* Total Referrals */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-2 md:p-3 rounded-lg bg-slate-800/40 border border-slate-700/50"
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-white">{stats.totalReferrals}</p>
        </motion.div>

        {/* Deposited Referrals */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 border border-emerald-500/30"
        >
          <div className="flex items-center gap-2 mb-1">
            <Gift className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Depositados</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-emerald-400">{stats.depositedReferrals}</p>
        </motion.div>

        {/* Registered Referrals */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-2 md:p-3 rounded-lg bg-slate-800/40 border border-slate-700/50"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">Registrados</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-white">{stats.registeredReferrals}</p>
        </motion.div>

        {/* XP Earned */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border border-yellow-500/30"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">XP Ganho</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-yellow-400">+{stats.xpEarned}</p>
        </motion.div>
      </div>

      {/* Info Text */}
      <div className="p-2 md:p-3 rounded-lg bg-slate-800/20 border border-slate-700/30">
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-white">⚡ Como funciona:</strong> Compartilhe seu link com amigos. Quando eles se registrarem e fizerem o primeiro depósito, você receberá <strong className="text-emerald-400">500 XP</strong>. Você pode desbloquear os badges "Evangelista" (3 referências) e "Influencer" (10 referências)!
        </p>
      </div>
    </motion.div>
  );
}

export default ReferralCard;
