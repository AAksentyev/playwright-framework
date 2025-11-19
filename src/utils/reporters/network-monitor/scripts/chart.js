const ctx = document.getElementById('networkChart').getContext('2d');

new Chart(ctx, {
    type: 'bar',
    data: {
        labels: chartData.urls,
        datasets: [
            {
                label: 'Success',
                data: chartData.successCounts,
                backgroundColor: 'rgba(46, 204, 113, 0.8)',
                stack: 'requests',
            },
            {
                label: 'Fail',
                data: chartData.failCounts,
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                stack: 'requests',
            },
        ],
    },
    options: {
        responsive: true,
        scales: { x: { stacked: true }, y: { stacked: true } },
    },
});
