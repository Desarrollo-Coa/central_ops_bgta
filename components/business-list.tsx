import Link from "next/link";

interface BusinessItem {
  title: string;
  description: string;
  link: string;
}

interface BusinessListProps {
  negocios: BusinessItem[];
}

export function BusinessList({ negocios }: BusinessListProps) {
  return (
    <div className="bg-white rounded-lg shadow divide-y">
      {negocios.map((negocio) => (
        <Link href={negocio.link} key={negocio.title} className="block hover:bg-gray-50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{negocio.title}</h3>
                  <p className="text-sm text-gray-500">{negocio.description}</p>
                </div>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 