window.addEventListener('load', () => {
    console.log('Mark Movies as Seen extension loaded');

    // Function to extract movie title from a row
    function getMovieTitleFromRow(row) {
        // Look for the movie title in different possible locations
        // First try to find a link which typically contains the movie title
        const titleLink = row.querySelector('td a, th a');
        if (titleLink) {
            return titleLink.textContent.trim();
        }

        // If no link found, try the first or second cell (common patterns in Wikipedia tables)
        const firstCell = row.querySelector('td:first-child, th:first-child');
        const secondCell = row.querySelector('td:nth-child(2), th:nth-child(2)');

        if (firstCell && firstCell.textContent.includes('(')) {
            // Movie titles often have year in parentheses
            return firstCell.textContent.trim();
        } else if (secondCell) {
            return secondCell.textContent.trim();
        } else if (firstCell) {
            return firstCell.textContent.trim();
        }

        return null; // Couldn't find a title
    }

    // Map to track checkbox elements by movie title
    const movieCheckboxes = new Map();

    // Select all tables with the "wikitable" class
    const tables = document.querySelectorAll('.wikitable');

    tables.forEach((table, tableIndex) => {
        // Find or create the header row
        let headerRow;
        const thead = table.querySelector('thead');
        if (thead) {
            headerRow = thead.querySelector('tr');
        } else {
            // If no thead exists, check if first row has th elements
            const firstRow = table.querySelector('tbody tr:first-child');
            if (firstRow && firstRow.querySelector('th')) {
                headerRow = firstRow;
            }
        }

        if (headerRow) {
            // Check if "Mark as Seen" header already exists
            const existingHeader = Array.from(headerRow.cells).find(cell =>
                cell.textContent.trim() === 'Mark as Seen'
            );

            if (!existingHeader) {
                // Add "Mark as Seen" column header
                const headerCell = document.createElement('th');
                headerCell.textContent = 'Mark as Seen';
                headerCell.style.backgroundColor = "#f2f2f2"; // Match Wikipedia styling
                headerRow.appendChild(headerCell);
            }
        }

        // Select data rows - skip header rows by targeting rows with <td> elements
        const dataRows = Array.from(table.querySelectorAll('tbody tr')).filter(row =>
            row.querySelector('td') && !row.querySelector('[data-mark-as-seen]')
        );

        dataRows.forEach(row => {
            const movieTitle = getMovieTitleFromRow(row);
            if (!movieTitle) return; // Skip if no title could be extracted

            const cell = document.createElement('td');
            cell.setAttribute('data-mark-as-seen', 'true');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';

            // Use movie title as the storage key for consistency across tables
            const storageKey = `movie-seen-${movieTitle}`;

            // Restore saved checkbox state
            const savedStatus = localStorage.getItem(storageKey);
            if (savedStatus === 'true') {
                checkbox.checked = true;
            }

            checkbox.addEventListener('change', () => {
                // Save the checkbox state
                localStorage.setItem(storageKey, checkbox.checked);

                // Find and update all checkboxes for this movie
                if (movieCheckboxes.has(movieTitle)) {
                    movieCheckboxes.get(movieTitle).forEach(cb => {
                        if (cb !== checkbox) { // Avoid infinite loop
                            cb.checked = checkbox.checked;
                        }
                    });
                }
            });

            // Add this checkbox to the tracking map
            if (!movieCheckboxes.has(movieTitle)) {
                movieCheckboxes.set(movieTitle, []);
            }
            movieCheckboxes.get(movieTitle).push(checkbox);

            cell.appendChild(checkbox);
            row.appendChild(cell);
        });
    });
});
//