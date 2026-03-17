/**
 * Couleurs officielles du jeu Trio
 * Chaque numéro a sa couleur spécifique du violet (1) au bleu (12)
 */
// Couleurs officielles du Trio (dégradé du violet au bleu)
export const TRIO_CARD_COLORS = {
    1: {
        background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', // Violet
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
    },
    2: {
        background: 'linear-gradient(135deg, #A855F7, #9333EA)', // Violet-pourpre
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
    },
    3: {
        background: 'linear-gradient(135deg, #C084FC, #A855F7)', // Pourpre clair
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(192, 132, 252, 0.4)'
    },
    4: {
        background: 'linear-gradient(135deg, #E879F9, #D946EF)', // Rose-pourpre
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(232, 121, 249, 0.4)'
    },
    5: {
        background: 'linear-gradient(135deg, #F472B6, #EC4899)', // Rose
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(244, 114, 182, 0.4)'
    },
    6: {
        background: 'linear-gradient(135deg, #FB7185, #F43F5E)', // Rose-rouge
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(251, 113, 133, 0.4)'
    },
    7: {
        background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', // Jaune-orange (spécial)
        text: '#1F2937',
        shadow: '0 4px 15px rgba(251, 191, 36, 0.4)'
    },
    8: {
        background: 'linear-gradient(135deg, #34D399, #10B981)', // Vert
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(52, 211, 153, 0.4)'
    },
    9: {
        background: 'linear-gradient(135deg, #22D3EE, #06B6D4)', // Cyan
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(34, 211, 238, 0.4)'
    },
    10: {
        background: 'linear-gradient(135deg, #60A5FA, #3B82F6)', // Bleu clair
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(96, 165, 250, 0.4)'
    },
    11: {
        background: 'linear-gradient(135deg, #4F46E5, #4338CA)', // Indigo
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(79, 70, 229, 0.4)'
    },
    12: {
        background: 'linear-gradient(135deg, #3730A3, #312E81)', // Bleu foncé
        text: '#FFFFFF',
        shadow: '0 4px 15px rgba(55, 48, 163, 0.4)'
    }
};
/**
 * Obtient les couleurs pour un numéro de carte donné
 */
export function getCardColor(number) {
    return TRIO_CARD_COLORS[number] || TRIO_CARD_COLORS[1];
}
/**
 * Obtient le style CSS pour une carte
 */
export function getCardStyle(number) {
    const colors = getCardColor(number);
    return {
        background: colors.background,
        color: colors.text,
        boxShadow: colors.shadow
    };
}
