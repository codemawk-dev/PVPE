// Ícones dourados da seção de inscrições e premiação.
// O degradê "gold" fica definido uma vez em <GoldGradient /> e é usado por todos.

export function RegistrationIcon() {
  return (
    <svg className="prize-icon" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="12" y="10" width="40" height="48" rx="5" className="gold-stroke" />
      <rect x="23" y="5" width="18" height="10" rx="3" className="gold-fill" />
      <circle cx="22" cy="27" r="2.6" className="gold-fill" /><path d="M29 27h15" className="gold-stroke" />
      <circle cx="22" cy="37" r="2.6" className="gold-fill" /><path d="M29 37h15" className="gold-stroke" />
      <circle cx="22" cy="47" r="2.6" className="gold-fill" /><path d="M29 47h15" className="gold-stroke" />
    </svg>
  );
}

export function TrophyIcon() {
  return (
    <svg className="prize-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 8h28v14a14 14 0 0 1-28 0z" className="gold-fill" />
      <path d="M18 13H9a9 9 0 0 0 11 11M46 13h9a9 9 0 0 1-11 11" className="gold-stroke" />
      <path d="M28 35h8v9h-8z" className="gold-fill" />
      <path d="M21 44h22l2 7H19z" className="gold-fill" />
      <rect x="15" y="51" width="34" height="8" rx="2" fill="#1b1b22" stroke="#ffd600" strokeWidth="2" />
      <path d="M25 12v10" stroke="#fff6c4" strokeWidth="3" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export function MedalIcon() {
  return (
    <svg className="prize-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M16 4h10l8 18h-10zM48 4H38l-8 18h10z" fill="#2c6be0" stroke="#ffd600" strokeWidth="1.5" />
      <circle cx="32" cy="40" r="18" className="gold-fill" />
      <circle cx="32" cy="40" r="12.5" fill="none" stroke="#a87400" strokeWidth="2" />
      <path d="M32 31.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#fff3b0" />
    </svg>
  );
}

export function GoldGradient() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="60">
          <stop offset="0" stopColor="#ffe680" />
          <stop offset=".5" stopColor="#ffc21a" />
          <stop offset="1" stopColor="#c98a00" />
        </linearGradient>
      </defs>
    </svg>
  );
}
