/** The institutions behind the project, with the logos in public/images: the intro and the footer of the app show the same four. */
export interface Institution {
  name: string;
  src: string;
  href: string;
}

export const INSTITUTIONS: ReadonlyArray<Institution> = [
  { name: 'Universidad de San Andrés', src: '/images/udesa-logo-recortado.png', href: 'https://www.udesa.edu.ar' },
  { name: 'Data Science Lab, Universidad de San Andrés', src: '/images/data-lab-recortado.webp', href: 'https://www.udesa.edu.ar/data-science-lab' },
  { name: 'Contar con Datos', src: '/images/contar-con-datos-logo-udesa.webp', href: 'https://www.udesa.edu.ar/contar-con-datos' },
  {
    name: 'Secretaría de Innovación, Ciencia y Tecnología',
    src: '/images/logo-subsecretaria-sscyt-blanco.png',
    href: 'https://www.argentina.gob.ar/jefatura/innovacion-ciencia-y-tecnologia'
  }
];
