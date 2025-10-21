'use strict';

(function ($) {
  $('#addRow').click(function() {
      const rowCount = $('#invoice-table tbody tr').length + 1;
      const newRow = `
          <tr>
              <td>${String(rowCount).padStart(2, '0')}</td>
              <td><input type="text" class="invoive-form-control" value="New Subject"></td>
              <td><input type="number" class="invoive-form-control" value="30"></td>
              <td><input type="text" class="invoive-form-control" value="70"></td>
              <td><input type="number" class="invoive-form-control" value="100" step="100"></td>
              <td><input type="text" class="invoive-form-control" value="A" step="A"></td>
              <td><input type="text" class="invoive-form-control" value="Excellent" step="Excellent"></td>
              <td class="text-center">
                  <button type="button" class="remove-row"><iconify-icon icon="ic:twotone-close" class="text-danger-main text-xl"></iconify-icon></button>
              </td>
          </tr>
      `;
      $('#invoice-table tbody').append(newRow);
  });

  $(document).on('click', '.remove-row', function() {
      $(this).closest('tr').remove();
      updateRowNumbers();
  });

  function updateRowNumbers() {
    $('#invoice-table tbody tr').each(function(index) {
      $(this).find('td:first').text(String(index + 1).padStart(2, '0'));
    });
  }

  // Make table cells editable on click
  $('.editable').click(function() {
    const cell = $(this);
    const originalText = cell.text().substring(1); // Remove the leading ':'
    const input = $('<input type="text" class="invoive-form-control" />').val(originalText);

    cell.empty().append(input);

    input.focus().select();

    input.blur(function() {
        const newText = input.val();
        cell.text(' ' + newText);
    });

    input.keypress(function(e) {
        if (e.which == 13) { // Enter key
            const newText = input.val();
            cell.text(':' + newText);
        }
    });
  });
})(jQuery);