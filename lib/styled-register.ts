import type * as XLSX from 'xlsx';

/** Fill values in the formatted template without rebuilding its styles. */
export async function downloadStyledRegister(book: XLSX.WorkBook, filename: string) {
  const ExcelJS = (await import('exceljs')).default;
  const response = await fetch('/templates/so-theo-doi-tre-mam-non.xlsx');
  if (!response.ok) throw new Error('Không tải được mẫu sổ có định dạng');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await response.arrayBuffer());
  for (const name of book.SheetNames) {
    const target = workbook.getWorksheet(name);
    if (!target) continue;
    for (const [address, source] of Object.entries(book.Sheets[name])) {
      if (address.startsWith('!')) continue;
      const cell = target.getCell(address);
      if (cell.isMerged && cell.master.address !== address) continue;
      cell.value = source.f ? { formula: source.f, result: source.v } : source.v ?? null;
      if (name === 'SYLL' && /^P\d+$/.test(address)) cell.numFmt = '@';
      if (name === 'SYLL' && /^E(?:[6-9]|[1-5]\d)$/.test(address)) {
        const date = String(source.v || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (date) {
          cell.value = new Date(Date.UTC(Number(date[3]), Number(date[2])-1, Number(date[1])));
          cell.numFmt = 'dd/mm/yyyy';
        }
      }
    }
    target.pageSetup = {
      paperSize: 9, orientation: 'landscape', fitToPage: true,
      fitToWidth: 1, fitToHeight: name === 'SYLL' ? 0 : 1,
      horizontalCentered: true,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.15, footer: 0.15 },
      printArea: name === 'SYLL' ? 'A1:P58' : name === 'từng tháng' ? 'A1:AM50' : 'A1:V36',
      ...(name === 'SYLL' ? { printTitlesRow: '1:5' } : name === 'từng tháng' ? { printTitlesRow: '1:3' } : {}),
    };
    if (name === 'từng tháng') {
      target.views = [{ state: 'frozen', xSplit: 3, ySplit: 3 }];
      target.getCell('A40').value = 'Tổng số trẻ có mặt';
      target.getCell('A40').font = { name: 'Times New Roman', size: 10, bold: true };
    }
  }
  workbook.calcProperties.fullCalcOnLoad = true;
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
