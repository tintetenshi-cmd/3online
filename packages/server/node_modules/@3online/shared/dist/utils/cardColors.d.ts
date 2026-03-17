/**
 * Couleurs officielles du jeu Trio
 * Chaque numéro a sa couleur spécifique du violet (1) au bleu (12)
 */
export interface CardColor {
    background: string;
    text: string;
    shadow: string;
}
export declare const TRIO_CARD_COLORS: Record<number, CardColor>;
/**
 * Obtient les couleurs pour un numéro de carte donné
 */
export declare function getCardColor(number: number): CardColor;
/**
 * Obtient le style CSS pour une carte
 */
export declare function getCardStyle(number: number): {
    [key: string]: string;
};
