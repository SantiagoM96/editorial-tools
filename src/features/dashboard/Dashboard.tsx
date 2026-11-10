import { editorialTools } from '../../domain/editorial-tools';
import { ToolCard } from './ToolCard';

export function Dashboard() {
  return (
    <>
      <header>
        <div className="wrap">
          <span className="brand">Herramientas editoriales</span>
          <span className="env">Entorno de desarrollo</span>
        </div>
      </header>
      <main className="wrap">
        <p className="eyebrow">Generadores de contenido</p>
        <h1>Elegí el producto que vas a editar</h1>
        <p className="intro">
          Accedé a los generadores para preparar placas y posteos. Este espacio reúne las
          versiones de prueba; los proyectos publicados se mantienen separados.
        </p>
        <div className="grid">
          {editorialTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </main>
      <footer className="wrap">
        Área de pruebas · Los cambios aquí no modifican automáticamente producción.
      </footer>
    </>
  );
}
