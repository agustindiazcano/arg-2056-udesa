import type { StepsByScene } from '../../story/types';
import { parseYear } from '../../types/year';

/**
 * DRAFT story steps, written from what each scene shows on the illustrative data. They state no figure and no
 * historical claim beyond what the project already treats as established, and none has a source yet. The human
 * reviews and signs each text and adds its sources before the release: the steps keep `placeholder: true` so the
 * release gate (scripts/check_no_mock.py --content) fails until then. The focus values drive the scene.
 * Keep every step a literal object so the gate can print the scene and the id.
 */
export const STEPS: StepsByScene = {
  andes: [
    {
      id: 'step-1',
      title: 'Cruzar la cordillera',
      text: 'En enero de 1817 el Ejército de los Andes cruzó la cordillera para llegar a Chile. Esta escena mostrará la campaña en el mapa; los datos de esta versión son ilustrativos.',
      focus: {},
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-2',
      title: 'Varias columnas',
      text: 'El cruce se hizo por distintos pasos al mismo tiempo. Cuántos hombres y animales fueron es un punto en el que los historiadores no coinciden, así que se mostrará un rango con su fuente.',
      focus: {},
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-3',
      title: 'El recorrido día a día',
      text: 'Cada punto del mapa tendrá su fecha, su altura y las fuerzas en juego, y el panel lateral dirá de dónde sale cada dato.',
      focus: {},
      source_ids: [],
      placeholder: true
    }
  ],
  economy: [
    {
      id: 'step-1',
      title: 'Punto de partida',
      text: 'Desde 1880, la economía argentina se compara con la de sus pares de la región. Los valores de esta versión son ilustrativos.',
      focus: { year: parseYear(1880) },
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-2',
      title: 'A mitad de camino',
      text: 'Las franjas de colores separan períodos de la historia económica. Hoy son provisorias: las define el equipo con sus fuentes.',
      focus: { year: parseYear(1950) },
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-3',
      title: 'Hoy frente a la región',
      text: 'El puesto de Argentina entre los países elegidos cambia con el indicador y con el año: se lee en el ranking y en su evolución.',
      focus: { year: parseYear(2025) },
      source_ids: [],
      placeholder: true
    }
  ],
  resources: [
    {
      id: 'step-1',
      title: 'Qué se exporta',
      text: 'El mapa de árbol muestra la composición de las exportaciones o del PIB: cuanto más grande el área, mayor el valor.',
      focus: {},
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-2',
      title: 'Producción por provincia',
      text: 'Las barras comparan las provincias para un recurso y un año; las de menor peso se agrupan en Otras. Con una provincia elegida, se destaca en el gráfico.',
      focus: {},
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-3',
      title: 'Proyectos de inversión',
      text: 'La tabla lista los proyectos de cada recurso según su estado, de mayor a menor inversión estimada.',
      focus: {},
      source_ids: [],
      placeholder: true
    }
  ],
  forecast: [
    {
      id: 'step-1',
      title: 'Escenario pesimista',
      text: 'Es una lectura del abanico de resultados simulados, no una predicción: muestra qué pasaría si las condiciones salen peor de lo esperado.',
      focus: { scenario: 'pessimistic' },
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-2',
      title: 'Escenario esperado',
      text: 'La línea central es la mediana de las simulaciones y la banda va del percentil 10 al 90: ocho de cada diez resultados simulados caen dentro.',
      focus: { scenario: 'expected' },
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-3',
      title: 'Hacia 2056',
      text: 'Al reproducir, el año avanza hasta 2056 y se ve cómo cambian el abanico, el mapa y el ranking de provincias.',
      focus: { scenario: 'optimistic', play: { fromYear: parseYear(2026), toYear: parseYear(2056) } },
      source_ids: [],
      placeholder: true
    }
  ],
  'ai-revolution': [
    {
      id: 'step-1',
      title: 'La IA como un rango',
      text: 'El impacto de la inteligencia artificial se mostrará como un rango con sus fuentes, nunca como un único número.',
      focus: {},
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-2',
      title: 'Con y sin IA',
      text: 'Con el efecto de la IA activado, una línea punteada muestra la trayectoria sin IA para poder comparar.',
      focus: { aiOverlay: true },
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-3',
      title: 'Qué falta saber',
      text: 'Los supuestos de cada estimación y su incertidumbre se listarán a su lado, para que se pueda juzgar cuánto confiar en ella.',
      focus: {},
      source_ids: [],
      placeholder: true
    }
  ],
  sandbox: [
    {
      id: 'step-1',
      title: 'Cambiar un supuesto',
      text: 'Los controles ajustan el crecimiento del PIB per cápita, el de la población y el aporte de la IA, y el gráfico muestra qué implican.',
      focus: {},
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-2',
      title: 'La regla del 70',
      text: 'Dividir 70 por la tasa de crecimiento da, de forma aproximada, los años que tarda en duplicarse un nivel.',
      focus: {},
      source_ids: [],
      placeholder: true
    },
    {
      id: 'step-3',
      title: 'Frente al rango del modelo',
      text: 'El resultado se compara con el rango del modelo. Es aritmética ilustrativa sobre los supuestos elegidos, no el modelo de pronóstico.',
      focus: {},
      source_ids: [],
      placeholder: true
    }
  ]
};
