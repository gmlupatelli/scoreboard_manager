export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-10 bg-muted rounded-md w-2/3 mb-3"></div>
          <div className="h-6 bg-muted rounded-md w-full max-w-3xl mb-4"></div>
          <div className="h-8 bg-muted rounded-md w-32"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-10 bg-muted rounded-md w-full max-w-md mb-6"></div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b-2 border-border">
                  <th className="px-6 py-4 w-24">
                    <div className="h-5 bg-border rounded w-16"></div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="h-5 bg-border rounded w-24"></div>
                  </th>
                  <th className="px-6 py-4 w-32">
                    <div className="h-5 bg-border rounded w-20 ml-auto"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, index) => (
                  <tr key={index} className="border-b border-border">
                    <td className="px-6 py-4">
                      <div className="h-6 bg-muted rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-muted rounded w-48"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-muted rounded w-20 ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
