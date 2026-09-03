export const avatarColors = [
    { bg: 'bg-red-500', ring: 'ring-red-500' },
    { bg: 'bg-orange-500', ring: 'ring-orange-500' },
    { bg: 'bg-amber-500', ring: 'ring-amber-500' },
    { bg: 'bg-yellow-500', ring: 'ring-yellow-500' },
    { bg: 'bg-lime-500', ring: 'ring-lime-500' },
    { bg: 'bg-green-500', ring: 'ring-green-500' },
    { bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
    { bg: 'bg-teal-500', ring: 'ring-teal-500' },
    { bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
    { bg: 'bg-sky-500', ring: 'ring-sky-500' },
    { bg: 'bg-blue-500', ring: 'ring-blue-500' },
    { bg: 'bg-indigo-500', ring: 'ring-indigo-500' },
    { bg: 'bg-violet-500', ring: 'ring-violet-500' },
    { bg: 'bg-purple-500', ring: 'ring-purple-500' },
    { bg: 'bg-pink-500', ring: 'ring-pink-500' },
] as const;

export const getAvatarColor = (value?: string) => {
    if (!value) {
        return {
            bg: 'bg-primary',
            ring: 'ring-primary',
        };
    }

    const hash = value
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return avatarColors[hash % avatarColors.length];
};


// Soft pastel background + saturated text pairs (mockup "Modern Bento" avatar style).
export const avatarSoftColors = [
    { bg: 'bg-red-100', text: 'text-red-700' },
    { bg: 'bg-orange-100', text: 'text-orange-700' },
    { bg: 'bg-amber-100', text: 'text-amber-700' },
    { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    { bg: 'bg-lime-100', text: 'text-lime-700' },
    { bg: 'bg-green-100', text: 'text-green-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    { bg: 'bg-teal-100', text: 'text-teal-700' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    { bg: 'bg-sky-100', text: 'text-sky-700' },
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    { bg: 'bg-violet-100', text: 'text-violet-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-pink-100', text: 'text-pink-700' },
] as const;

export const getAvatarSoftColor = (value?: string) => {
    if (!value) {
        return { bg: 'bg-primary/10', text: 'text-primary' };
    }

    const hash = value
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return avatarSoftColors[hash % avatarSoftColors.length];
};

export const getInitialName = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};