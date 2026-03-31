export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="bg-background rounded-xl shadow-md p-8 max-w-md w-full text-center flex flex-col gap-4">
        <h1 className="text-3xl font-bold">CarWash</h1>
        <p className="text-muted-foreground">
          Para agendar uma lavagem, acesse o link do seu posto:
        </p>
        <div className="bg-secondary rounded-lg px-4 py-3 font-mono text-sm text-foreground">
          app.dominio.com/<span className="text-primary font-semibold">nome-do-posto</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Não é necessário criar conta. Basta informar seu nome, telefone e placa.
        </p>
        <hr className="border-border" />
        <a
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Acesso para funcionários →
        </a>
      </div>
    </div>
  );
}
