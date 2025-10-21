import React, { useState, useRef, useEffect, Fragment } from 'react';
import { XCircle } from 'lucide-react';

export interface Negocio {
  id_negocio: number;
  nombre_negocio: string;
}

interface selectorNegocioGeneralesProps {
  negocios: Negocio[];
  negocioSeleccionado: { id: number; nombre: string } | null;
  onSeleccionar: (negocio: { id: number; nombre: string } | null) => void;
  opcionGenerales: boolean;
  setOpcionGenerales: (v: boolean) => void;
}

const selectorNegocioGenerales: React.FC<selectorNegocioGeneralesProps> = ({
  negocios,
  negocioSeleccionado,
  onSeleccionar,
  opcionGenerales,
  setOpcionGenerales,
}) => {
  const [busquedaNegocio, setBusquedaNegocio] = useState('');
  const [sugerenciasNegocio, setSugerenciasNegocio] = useState<Negocio[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const negocioTabRefs = useRef<{ [id: number]: HTMLSpanElement | null }>({});
  const scrollTabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (busquedaNegocio.trim() === '') {
      setSugerenciasNegocio([]);
      setMostrarSugerencias(false);
      return;
    }
    const sugerencias = negocios.filter(n =>
      n.nombre_negocio.toLowerCase().includes(busquedaNegocio.toLowerCase())
    );
    setSugerenciasNegocio(sugerencias);
    setMostrarSugerencias(sugerencias.length > 0);
  }, [busquedaNegocio, negocios]);

  useEffect(() => {
    if (negocioSeleccionado && negocioTabRefs.current[negocioSeleccionado.id]) {
      negocioTabRefs.current[negocioSeleccionado.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [negocioSeleccionado]);

  const seleccionarNegocioBusqueda = (negocio: Negocio) => {
    onSeleccionar({ id: negocio.id_negocio, nombre: negocio.nombre_negocio });
    setBusquedaNegocio('');
    setMostrarSugerencias(false);
  };

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = scrollTabsRef.current;
    if (!el) return;
    const scrollAmount = 200;
    if (dir === 'left') {
      el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center w-full">
      {/* Buscador de negocios */}
      <div className="relative mr-2 min-w-[180px] max-w-[260px]">
        <input
          type="text"
          className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Buscar negocio..."
          value={busquedaNegocio}
          onChange={e => setBusquedaNegocio(e.target.value)}
          onFocus={() => setMostrarSugerencias(sugerenciasNegocio.length > 0)}
          onBlur={() => setTimeout(() => setMostrarSugerencias(false), 120)}
        />
        {mostrarSugerencias && (
          <ul className="absolute z-50 bg-white border border-gray-200 rounded shadow w-full mt-1 max-h-48 overflow-y-auto">
            {sugerenciasNegocio.map(n => (
              <li
                key={n.id_negocio}
                className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-sm"
                onMouseDown={() => seleccionarNegocioBusqueda(n)}
              >
                {n.nombre_negocio}
              </li>
            ))}
            {sugerenciasNegocio.length === 0 && (
              <li className="px-3 py-2 text-gray-400 text-sm">Sin resultados</li>
            )}
          </ul>
        )}
        {/* Botón limpiar filtro */}
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none"
          title="Limpiar filtro y volver a GENERALES"
          onClick={() => {
            setOpcionGenerales(true);
            onSeleccionar(null);
            setBusquedaNegocio('');
          }}
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      <button
        className="px-2 py-1 text-xl font-bold text-gray-500 hover:text-blue-600 focus:outline-none"
        onClick={() => scrollTabs('left')}
        aria-label="Desplazar negocios a la izquierda"
        type="button"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div
        ref={scrollTabsRef}
        className="tabs flex flex-nowrap items-center gap-0 overflow-x-auto px-2 max-w-[70dvh] scrollbar-hide"
        style={{ 
          scrollBehavior: 'smooth', 
          minWidth: 0,
          msOverflowStyle: 'none',  /* IE and Edge */
          scrollbarWidth: 'none',   /* Firefox */
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Opción GENERALES */}
        <span
          className={`cursor-pointer px-2 lg:px-4 font-bold whitespace-nowrap ${opcionGenerales ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
          onClick={() => {
            setOpcionGenerales(true);
            onSeleccionar(null);
          }}
        >
          GENERALES
        </span>
        <span className="mx-1 text-gray-400">|</span>
        {negocios.map((negocio, index) => (
          <Fragment key={negocio.id_negocio}>
            <span
              ref={el => { negocioTabRefs.current[negocio.id_negocio] = el; }}
              className={`cursor-pointer px-2 lg:px-4 font-bold whitespace-nowrap ${negocioSeleccionado?.id === negocio.id_negocio && !opcionGenerales ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
              onClick={() => {
                onSeleccionar({ id: negocio.id_negocio, nombre: negocio.nombre_negocio });
                setOpcionGenerales(false);
              }}
            >
              {negocio.nombre_negocio}
            </span>
            {index < negocios.length - 1 && (
              <span className="mx-1 text-gray-400" key={`sep-${negocio.id_negocio}`}>|</span>
            )}
          </Fragment>
        ))}
      </div>
      <button
        className="px-2 py-1 text-xl font-bold text-gray-500 hover:text-blue-600 focus:outline-none"
        onClick={() => scrollTabs('right')}
        aria-label="Desplazar negocios a la derecha"
        type="button"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
};

export default selectorNegocioGenerales; 