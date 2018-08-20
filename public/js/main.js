(function() {
  const main = $('.js-main');
  const rating = $('.js-rating');

  main.find('table').DataTable({
    pageLength: 50,
    order: [[1, 'desc']]
  });

  main.on('click', '.js-load', (e) => {
    console.log('Clicked on', e.target);
    const row = $(e.target).closest('tr');
    const name = row.data('name');
    rating.html('Loading ...');

    $.getJSON(`/load/${name}`, (json) => {
      if (json.error) return rating.html(`
        <h2 class="error">Error</h2>
        <pre>${JSON.stringify(json)}</pre>
      `);

      const html = `
        <h2>Results</h2>
        <hr />
        <p>Highest 2v2: ${json.highest2v2}</p>
        <p>Highest 3v3: ${json.highest3v3}</p>
        <p>Highest RBG: ${json.highestRbg}</p>
      `;

      row.find('.js-2v2').text(json.highest2v2);
      row.find('.js-3v3').text(json.highest3v3);
      row.find('.js-rbg').text(json.highestRbg);
      rating.html(html);
    });
  });

})();
