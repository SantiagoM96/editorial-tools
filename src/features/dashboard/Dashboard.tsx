import { editorialTools } from '../../domain/editorial-tools';
import { ToolCard } from './ToolCard';

const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_EDITORIAL_ENV === 'development';
const deployedSha = import.meta.env.VITE_EDITORIAL_SHA;

export function Dashboard() {
  return (
    <>
      <header>
        <div className="wrap">
          <span className="brand">Herramientas editoriales</span>
          {isDevelopment && <span className="env">ENTORNO DE DESARROLLO</span>}
        </div>
      </header>
      <main className="wrap">
        <p className="eyebrow">Generadores de contenido</p>
        <h1>Elegí el producto que vas a editar</h1>
        <p className="intro">
          Accedé a los generadores para preparar placas y posteos.
          {isDevelopment
            ? ' Este ambiente permite probar cambios antes de su publicación.'
            : ' Estas son las versiones aprobadas para producción.'}
        </p>
        <div className="grid">
          {editorialTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </main>
      <footer className="wrap">
        {isDevelopment ? 'DEV · No modifica producción.' : 'PROD · Versión aprobada.'}
        {deployedSha && <span> · Commit {deployedSha.slice(0, 8)}</span>}
      </footer>
    </>
  );
}
