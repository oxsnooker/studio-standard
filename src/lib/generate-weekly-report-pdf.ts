'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Bill, BilliardTable } from './types';

function formatDuration(seconds: number) {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00';
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => (v < 10 ? '0' + v : v)).join(':');
}

export const generateWeeklyReportPdf = (bills: Bill[], tables: BilliardTable[]) => {
  const doc = new jsPDF();
  const tableMap = new Map(tables.map(t => [t.id, t.name]));

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Weekly Bookings Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const today = new Date();
  doc.text(`Report Generated: ${format(today, 'dd MMM yyyy, p')}`, 105, 28, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(180, 180, 180);
  doc.line(15, 32, 195, 32);

  const head = [['Table', 'Start Time', 'End Time', 'Duration', 'Table Cost', 'Snacks Cost', 'Total']];
  
  const body = bills.map(bill => {
    const tableName = tableMap.get(bill.sessionId) || 'Unknown';
    return [
      tableName,
      format(new Date(bill.startTime), 'dd/MM, p'),
      format(new Date(bill.endTime), 'dd/MM, p'),
      formatDuration(bill.duration),
      `Rs. ${bill.tableBill.toFixed(2)}`,
      `Rs. ${bill.itemsBill.toFixed(2)}`,
      `Rs. ${bill.totalAmount.toFixed(2)}`,
    ];
  });
  
  autoTable(doc, {
    startY: 35,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
  });

  // Auto-download
  doc.save(`Weekly-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
