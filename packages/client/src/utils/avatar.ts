export function getAvatarEmoji(avatarId: string): string {
  const map: Record<string, string> = {
    GENERATED: '🃏',
    AVATAR_1: '💾',
    AVATAR_2: '👽',
    AVATAR_3: '🤖',
    AVATAR_4: '👻',
    AVATAR_5: '⭐',
    AVATAR_6: '💎',
    AVATAR_7: '🦊',
    AVATAR_8: '🦉',
    AVATAR_9: '🐙',
    AVATAR_10: '🪐',
    AVATAR_11: '🧠',
    AVATAR_12: '🧩',
  }
  return map[avatarId] || '👤'
}

