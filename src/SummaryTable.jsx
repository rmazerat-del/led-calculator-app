/**
 * SummaryTable.jsx
 *
 * Tableau récapitulatif des écrans LED configurés.
 * Style Apple-inspired avec Tailwind CSS.
 *
 * @component
 * @param {Object[]} screens - Tableau d'objets écrans
 * @param {number} screens[].id - ID unique de l'écran
 * @param {string} screens[].name - Nom de l'écran
 * @param {number} screens[].widthM - Largeur réelle en mètres
 * @param {number} screens[].heightM - Hauteur réelle en mètres
 * @param {string} screens[].panelModel - Modèle de panneau
 * @param {number} screens[].panelCount - Nombre de panneaux
 * @param {string} screens[].resolution - Résolution totale (ex: "1536 × 896 px")
 * @param {number} screens[].weightKg - Poids total en kg
 * @param {number} screens[].powerMaxW - Consommation max en watts
 * @param {number} screens[].powerAvgW - Consommation moyenne en watts
 * @param {string|null} screens[].controller - Contrôleur recommandé (optionnel)
 * @param {function} [onScreenClick] - Callback optionnel (id) => void pour clic sur ligne
 * @param {string} [className] - Classes CSS additionnelles
 */

export default function SummaryTable({
  screens = [],
  onScreenClick = null,
  className = ""
}) {
  // État vide
  if (!screens || screens.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-12 ${className}`}>
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <svg
            className="w-16 h-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Aucun écran configuré</p>
            <p className="text-xs text-gray-500">Calculez un écran pour voir la synthèse apparaître ici</p>
          </div>
        </div>
      </div>
    );
  }

  // Calcul des totaux
  const totals = screens.reduce(
    (acc, screen) => ({
      panelCount: acc.panelCount + (screen.panelCount || 0),
      weightKg: acc.weightKg + (screen.weightKg || 0),
      powerMaxW: acc.powerMaxW + (screen.powerMaxW || 0),
      powerAvgW: acc.powerAvgW + (screen.powerAvgW || 0),
    }),
    { panelCount: 0, weightKg: 0, powerMaxW: 0, powerAvgW: 0 }
  );

  const handleRowClick = (id) => {
    if (onScreenClick) {
      onScreenClick(id);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Conteneur avec scroll horizontal sur mobile */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* En-tête */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">#</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Écran</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dim. réelle</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Panneau</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qté</span>
              </th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Résolution</span>
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Poids</span>
              </th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conso moy.</span>
              </th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conso max</span>
              </th>
              <th className="px-4 py-3 text-left hidden xl:table-cell">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contrôleur</span>
              </th>
            </tr>
          </thead>

          {/* Corps */}
          <tbody>
            {screens.map((screen, index) => (
              <tr
                key={screen.id}
                onClick={() => handleRowClick(screen.id)}
                className={`
                  border-b border-gray-100 transition-colors
                  ${index % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}
                  ${onScreenClick ? 'cursor-pointer hover:bg-blue-50/30' : ''}
                `}
              >
                {/* # */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
                    {index + 1}
                  </span>
                </td>

                {/* Écran */}
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-gray-900">{screen.name || '—'}</span>
                </td>

                {/* Dim. réelle */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900 font-mono">
                    {typeof screen.widthM === 'number' && typeof screen.heightM === 'number'
                      ? `${screen.widthM.toFixed(2)} × ${screen.heightM.toFixed(2)} m`
                      : '—'}
                  </span>
                </td>

                {/* Panneau */}
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{screen.panelModel || '—'}</span>
                </td>

                {/* Qté */}
                <td className="px-4 py-3">
                  <span className="text-sm font-bold text-blue-600">
                    {screen.panelCount || 0}
                  </span>
                </td>

                {/* Résolution (hidden sur mobile) */}
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-sm text-gray-700 font-mono">{screen.resolution || '—'}</span>
                </td>

                {/* Poids (hidden sur mobile/tablette) */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-gray-700">
                    {typeof screen.weightKg === 'number' ? `${screen.weightKg.toFixed(1)} kg` : '—'}
                  </span>
                </td>

                {/* Conso moy. (hidden jusqu'à lg) */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm text-gray-700">
                    {typeof screen.powerAvgW === 'number'
                      ? `${(screen.powerAvgW / 1000).toFixed(2)} kW`
                      : '—'}
                  </span>
                </td>

                {/* Conso max (hidden jusqu'à lg) */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-sm text-gray-700">
                    {typeof screen.powerMaxW === 'number'
                      ? `${(screen.powerMaxW / 1000).toFixed(2)} kW`
                      : '—'}
                  </span>
                </td>

                {/* Contrôleur (hidden jusqu'à xl) */}
                <td className="px-4 py-3 hidden xl:table-cell">
                  <span className={`text-sm ${screen.controller ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {screen.controller || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

          {/* Pied de page : ligne totaux */}
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-gray-300">
              {/* # */}
              <td className="px-4 py-3" />

              {/* Écran */}
              <td className="px-4 py-3">
                <span className="text-sm font-bold text-gray-900">Totaux</span>
              </td>

              {/* Dim. réelle */}
              <td className="px-4 py-3">
                <span className="text-sm text-gray-500">—</span>
              </td>

              {/* Panneau */}
              <td className="px-4 py-3">
                <span className="text-sm text-gray-500">—</span>
              </td>

              {/* Qté */}
              <td className="px-4 py-3">
                <span className="text-sm font-bold text-blue-600">{totals.panelCount}</span>
              </td>

              {/* Résolution */}
              <td className="px-4 py-3 hidden sm:table-cell">
                <span className="text-sm text-gray-500">—</span>
              </td>

              {/* Poids */}
              <td className="px-4 py-3 hidden md:table-cell">
                <span className="text-sm font-semibold text-gray-900">
                  {totals.weightKg.toFixed(1)} kg
                </span>
              </td>

              {/* Conso moy. */}
              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-sm font-semibold text-gray-900">
                  {(totals.powerAvgW / 1000).toFixed(2)} kW
                </span>
              </td>

              {/* Conso max */}
              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-sm font-semibold text-gray-900">
                  {(totals.powerMaxW / 1000).toFixed(2)} kW
                </span>
              </td>

              {/* Contrôleur */}
              <td className="px-4 py-3 hidden xl:table-cell">
                <span className="text-sm text-gray-500">—</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
