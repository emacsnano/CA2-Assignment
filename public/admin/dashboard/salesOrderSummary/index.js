// you can modify the code to suit your needs

window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const headers = {
    Authorization: `Bearer ${token}`
  };

  // Fetch and render each section of display Admin Dashboard
  fetchAndRender('/saleOrders/dashboard/spendingByAgeGender', 'ageGenderTable', renderAgeGender);
  fetchAndRender('/saleOrders/dashboard/latestSpendingPerMember', 'latestSpendingTable', renderLatestSpending);
  fetchAndRender('/saleOrders/dashboard/topSpenders', 'topSpendersTable', renderTopSpenders);
  fetchAndRender('/saleOrders/dashboard/minMaxSpendingPerMember', 'minMaxSpendingTable', renderMinMaxSpending);

  function fetchAndRender(endpoint, tableId, renderer) {
    fetch(endpoint, { headers })
      .then(res => res.json())
      .then(data => {
        console.log(`Data from ${endpoint}:`, data);
        renderer(document.querySelector(`#${tableId} tbody`), data);
      })
      .catch(err => {
        console.error(`Fetch error for ${endpoint}:`, err);
        const tbody = document.querySelector(`#${tableId} tbody`);
        tbody.innerHTML = `<tr><td colspan="10">Error: ${err.message}</td></tr>`;
      });
  }

  function renderAgeGender(tbody, data) {
    if (!data.length) return (tbody.innerHTML = `<tr><td colspan="5">No data found</td></tr>`);
    tbody.innerHTML = data.map(row => `
      <tr>
        <td>${row.gender}</td>
        <td>${row.ageGroup}</td>
        <td>${row.memberCount}</td>
        <td>${row.totalSpent}</td>
        <td>${row.avgSpentPerOrder}</td>
      </tr>
    `).join('');
  }

  function renderLatestSpending(tbody, data) {
    if (!data.length) return (tbody.innerHTML = `<tr><td colspan="4">No data found</td></tr>`);
    tbody.innerHTML = data.map(row => `
      <tr>
        <td>${row.memberId}</td>
        <td>${row.username}</td>
        <td>${new Date(row.latestOrderDate).toLocaleString()}</td>
        <td>${row.latestOrderSpent}</td>
      </tr>
    `).join('');
  }

  function renderTopSpenders(tbody, data) {
    if (!data.length) return (tbody.innerHTML = `<tr><td colspan="3">No data found</td></tr>`);
    tbody.innerHTML = data.map(row => `
      <tr>
        <td>${row.memberId}</td>
        <td>${row.username}</td>
        <td>${row.totalSpent}</td>
      </tr>
    `).join('');
  }

  function renderMinMaxSpending(tbody, data) {
    if (!data.length) return (tbody.innerHTML = `<tr><td colspan="4">No data found</td></tr>`);
    tbody.innerHTML = data.map(row => `
      <tr>
        <td>${row.memberId}</td>
        <td>${row.username}</td>
        <td>${row.minOrderSpent}</td>
        <td>${row.maxOrderSpent}</td>
      </tr>
    `).join('');
  }
});

// Admin Dashboard - Filter Spending By Age and Gender
document.getElementById('filterForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const gender = document.getElementById('genderSelect').value;
  const ageGroup = document.getElementById('ageGroupSelect').value;
  const onlyCompleted = document.getElementById('statusCompleted').checked;

  // Build query params based on selections
  const params = new URLSearchParams();
  if (gender) params.append('gender', gender);
  if (ageGroup) params.append('age_group', ageGroup);
  if (onlyCompleted) params.append('status', 'COMPLETED');

  const headers = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch('/saleOrders/dashboard/spendingByAgeGenderFiltered?' + params.toString(), {
        headers
    });
    const json = await res.json();

    const tbody = document.querySelector('#filteredTable tbody');
    const data = json.spendingByAgeGender || [];

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="5">No data found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(row => `
      <tr>
        <td>${row.gender}</td>
        <td>${row.ageGroup}</td>
        <td>${row.memberCount}</td>
        <td>${row.totalSpent}</td>
        <td>${row.avgSpentPerOrder}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Fetch error:', err);
  }
});

