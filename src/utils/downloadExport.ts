/**
 * Trigger a CSV export download for a scoreboard.
 * Calls the export API and triggers a browser file download.
 *
 * @param scoreboardId - The UUID of the scoreboard to export
 * @param getAuthHeaders - Async function that returns Authorization headers
 * @returns A promise that resolves to a success/error result
 */
export async function downloadScoreboardCSV(
  scoreboardId: string,
  getAuthHeaders: () => Record<string, string> | Promise<Record<string, string>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`/api/scoreboards/${scoreboardId}/export`, {
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = errorBody?.error || 'Export failed';
      return { success: false, error: message };
    }

    // Get filename from Content-Disposition header or use default
    const disposition = response.headers.get('Content-Disposition');
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `scoreboard-export-${Date.now()}.csv`;

    // Trigger browser download via blob URL
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (_error) {
    return { success: false, error: 'Failed to export scoreboard. Please try again.' };
  }
}
