import { useToast } from 'vue-toastification';

export function useClipboard() {
  const toast = useToast();

  const copy = (text: string, successMessage = 'Copiado para a área de transferência!') => {
    if (!navigator.clipboard) {
      toast.error('A área de transferência não é suportada neste navegador.');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      toast.success(successMessage);
    }).catch(err => {
      console.error('Falha ao copiar texto: ', err);
      toast.error('Não foi possível copiar o texto.');
    });
  };

  return { copy };
}
