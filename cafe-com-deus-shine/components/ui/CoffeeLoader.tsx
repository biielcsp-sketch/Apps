type CoffeeLoaderProps = {
  size?: number;
  label?: string;
};

// Substitui o círculo giratório genérico pelo vídeo da xícara de café em
// loop — usado em qualquer tela de carregamento do app.
export function CoffeeLoader({ size = 96, label = "Carregando" }: CoffeeLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-label={label}>
      <video
        src="/media/coffee-spinner.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
