// Mensagens automáticas de cada botão de WhatsApp.
export const WA_MESSAGES = {
  contato: 'Olá! Vim pelo site do PVPE e gostaria de mais informações sobre o projeto.',
  apoiar: 'Olá! Quero apoiar o PVPE 💛 Como posso ajudar o projeto de vôlei?',
  fazerParte: 'Olá! Quero fazer parte do PVPE 🏐 Como faço para participar dos treinos?',
  redes: 'Olá! Vi o WhatsApp do PVPE no site e gostaria de falar com vocês.',
  campeonato: (name: string) => `Olá! Vim pela página do campeonato ${name} e gostaria de mais informações.`,
  camisa: (modelo: string, tamanho: string) =>
    `Olá! Quero solicitar a camisa do PVPE 🏐\n\n• Modelo: ${modelo}\n• Tamanho: ${tamanho}\n\nPode me passar o valor e como faço para receber?`,
};

export const INSTAGRAM_URL = 'https://www.instagram.com/pvpe_urucuca/';
export const INSTAGRAM_HANDLE = '@pvpe_urucuca';
export const CODEMAWK_URL = 'https://instagram.com/codemawk';

// usado quando nenhum telefone estiver cadastrado
export const FALLBACK_PHONE = '5573991335759';
