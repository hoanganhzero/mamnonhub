import type * as XLSX from 'xlsx';

const thinBorder = {
  top: { style: 'thin' as const, color: { argb: 'FF000000' } },
  left: { style: 'thin' as const, color: { argb: 'FF000000' } },
  bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
  right: { style: 'thin' as const, color: { argb: 'FF000000' } },
};

function applyCommonFont(sheet: any, fromRow: number, toRow: number, fromCol: number, toCol: number, size = 11) {
  for (let row = fromRow; row <= toRow; row++) {
    for (let col = fromCol; col <= toCol; col++) {
      const cell = sheet.getCell(row, col);
      cell.font = { ...(cell.font || {}), name: 'Times New Roman', size };
      cell.alignment = {
        ...(cell.alignment || {}),
        vertical: 'middle',
        wrapText: true,
      };
    }
  }
}

function styleCover(sheet: any) {
  applyCommonFont(sheet, 1, 36, 1, 22, 12);
  for (const row of [1, 2, 3, 4, 5, 24, 25, 30]) {
    sheet.getRow(row).alignment = { vertical: 'middle', horizontal: 'center' };
  }
  for (const row of [1, 2, 3, 24, 25, 30]) {
    sheet.getRow(row).font = { name: 'Times New Roman', size: row === 30 ? 16 : 13, bold: true };
  }
  sheet.getRow(24).height = 26;
  sheet.getRow(25).height = 24;
  sheet.getRow(30).height = 26;
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    margins: { left: 0.45, right: 0.45, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 },
    printArea: 'A1:V36',
  };
}

function styleSyll(sheet: any) {
  applyCommonFont(sheet, 1, 58, 1, 16, 10.5);

  const widths = [5, 7, 7, 24, 12, 8, 18, 18, 18, 18, 16, 18, 16, 18, 15, 15];
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  for (let row = 1; row <= 5; row++) {
    const excelRow = sheet.getRow(row);
    excelRow.height = row <= 2 ? 24 : 38;
    excelRow.font = { name: 'Times New Roman', size: row <= 2 ? 12 : 10.5, bold: true };
    excelRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }

  for (let row = 5; row <= 41; row++) {
    sheet.getRow(row).height = row === 5 ? 40 : 24;
    for (let col = 1; col <= 16; col++) {
      const cell = sheet.getCell(row, col);
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: [4, 7, 8, 9, 10, 11, 12, 13, 14].includes(col) ? 'left' : 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.font = { name: 'Times New Roman', size: 10.5, bold: row === 5 };
    }
  }

  for (let row = 6; row <= 41; row++) {
    sheet.getCell(row, 5).numFmt = 'dd/mm/yyyy';
    sheet.getCell(row, 16).numFmt = '@';
  }

  sheet.views = [{ state: 'frozen', ySplit: 5, xSplit: 4 }];
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.15, footer: 0.15 },
    printArea: 'A1:P58',
    printTitlesRow: '1:5',
  };
}

function styleMonthly(sheet: any) {
  applyCommonFont(sheet, 1, 50, 1, 39, 10);

  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 24;
  sheet.getColumn(3).width = 9;
  for (let col = 4; col <= 34; col++) sheet.getColumn(col).width = 4.2;
  for (let col = 35; col <= 39; col++) sheet.getColumn(col).width = col === 35 ? 10 : 12;

  for (let row = 1; row <= 3; row++) {
    const excelRow = sheet.getRow(row);
    excelRow.height = row === 1 ? 28 : 24;
    excelRow.font = { name: 'Times New Roman', size: row === 1 ? 13 : 10, bold: true };
    excelRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }

  for (let row = 2; row <= 40; row++) {
    sheet.getRow(row).height = row <= 3 ? 24 : 22;
    for (let col = 1; col <= 39; col++) {
      const cell = sheet.getCell(row, col);
      cell.border = thinBorder;
      cell.alignment = {
        horizontal: col === 2 ? 'left' : 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.font = { name: 'Times New Roman', size: 10, bold: row <= 3 || row === 40 };
    }
  }

  sheet.getCell('A40').value = 'Tổng số trẻ có mặt';
  sheet.getCell('A40').font = { name: 'Times New Roman', size: 10, bold: true };
  sheet.getCell('A40').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  sheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 3 }];
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 },
    printArea: 'A1:AM50',
    printTitlesRow: '1:3',
  };
}

/**
 * Giữ mẫu gốc làm nền, chỉ điền dữ liệu và áp lại toàn bộ định dạng quan trọng
 * để GVCN tải về là in/dùng ngay, không phải căn chỉnh lại bằng tay.
 */
export async function downloadStyledRegister(book: XLSX.WorkBook, filename: string) {
  const ExcelJS = (await import('exceljs')).default;
  const response = await fetch('/templates/so-theo-doi-tre-mam-non.xlsx', { cache: 'no-store' });
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
          cell.value = new Date(Date.UTC(Number(date[3]), Number(date[2]) - 1, Number(date[1])));
          cell.numFmt = 'dd/mm/yyyy';
        }
      }
    }
  }

  const cover = workbook.getWorksheet('bia sổ');
  const syll = workbook.getWorksheet('SYLL');
  const monthly = workbook.getWorksheet('từng tháng');
  if (cover) styleCover(cover);
  if (syll) styleSyll(syll);
  if (monthly) styleMonthly(monthly);

  workbook.creator = 'Mầm Non Yêu Thương';
  workbook.lastModifiedBy = 'Mầm Non Yêu Thương';
  workbook.calcProperties.fullCalcOnLoad = true;

  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
