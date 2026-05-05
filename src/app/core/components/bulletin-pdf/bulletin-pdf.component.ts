import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bulletin-pdf',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulletin-pdf.component.html',
  styleUrls: ['./bulletin-pdf.component.scss']
})
export class BulletinPdfComponent {
  @Input() data: BulletinData | null = null;

  generatePdf(): void {
    if (!this.data) {
      console.error('Aucune donnée fournie pour le PDF');
      return;
    }
    this.telechargerPdf();
  }

static async genererPdfDirect(data: BulletinData): Promise<string> {
    try {
      const jsPDF = await import('jspdf');
      const { jsPDF: JsPDFClass } = jsPDF;
      
      const doc = new JsPDFClass({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);

      BulletinPdfComponent.genererEnTeteStatic(doc, pageWidth, margin, data);
      BulletinPdfComponent.genererInformationsEleveStatic(doc, margin, contentWidth, data);
      BulletinPdfComponent.genererTableauStatic(doc, margin, contentWidth, data);
      BulletinPdfComponent.genererRecapitulatifStatic(doc, margin, contentWidth, data);
      BulletinPdfComponent.genererSignaturesStatic(doc, pageWidth, pageHeight, margin);

      // Retourne les données PDF en base64 au lieu d'ouvrir dans un nouvel onglet
      return doc.output('datauristring');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      return '';
    }
  }

  private async telechargerPdf(): Promise<void> {
    if (!this.data) return;
    await BulletinPdfComponent.genererPdfDirect(this.data);
  }

  private static genererEnTeteStatic(doc: any, pageWidth: number, margin: number, data: BulletinData): void {
    const headerHeight = 35;

    doc.setFillColor(44, 90, 160);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    doc.setFillColor(34, 70, 130);
    doc.rect(0, headerHeight - 5, pageWidth, 5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(data.nomEcole, pageWidth / 2, 12, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`EXAMEN DU ${data.trimestre.toUpperCase()}`, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.text(data.anneeScolaire, pageWidth / 2, 27, { align: 'center' });

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin + 5, 8, 18, 18, 2, 2, 'F');
    doc.setTextColor(44, 90, 160);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('LOGO', margin + 14, 17, { align: 'center' });

    const texteDroite = 'République du Mali\nUn Peuple – Un But – Une Foi';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(texteDroite, pageWidth - margin - 5, 17, { align: 'right' });
  }

  private static genererInformationsEleveStatic(doc: any, margin: number, contentWidth: number, data: BulletinData): void {
    const startY = 45;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, startY, contentWidth, 30, 2, 2, 'F');

    doc.setDrawColor(200, 210, 220);
    doc.roundedRect(margin, startY, contentWidth, 30, 2, 2, 'S');

    doc.setTextColor(44, 90, 160);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS ÉLÈVE', margin + 5, startY + 7);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const valueX = margin + 33;

    doc.text('Nom :', margin + 5, startY + 16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.nom.toUpperCase(), valueX, startY + 16);

    doc.setFont('helvetica', 'normal');
    doc.text('Prénoms :', margin + 5, startY + 22);
    doc.setFont('helvetica', 'bold');
    doc.text(data.prenoms, valueX, startY + 22);

    doc.setFont('helvetica', 'normal');
    doc.text('Classe :', margin + 5, startY + 28);
    doc.setFont('helvetica', 'bold');
    doc.text(data.classe, valueX, startY + 28);
  }

  private static genererTableauStatic(doc: any, margin: number, contentWidth: number, data: BulletinData): void {
    const startY = 82;
    const ligneHauteur = 8;
    const cols = [
      { label: 'Matière', width: 45 },
      { label: 'Moy. Classe', width: 22 },
      { label: 'Note/40', width: 20 },
      { label: 'Moy/20', width: 18 },
      { label: 'Coef', width: 14 },
      { label: 'Moy. Coef', width: 22 },
      { label: 'Appréciation', width: 34 }
    ];

    const headerHeight = 10;

    doc.setFillColor(44, 90, 160);
    doc.rect(margin, startY, contentWidth, headerHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    let xPos = margin + 2;
    cols.forEach((col) => {
      doc.text(col.label, xPos + (col.width / 2), startY + 6.5, { align: 'center' });
      xPos += col.width;
    });

    doc.setDrawColor(255, 255, 255);
    doc.line(margin, startY + headerHeight, margin + contentWidth, startY + headerHeight);

    const matieres = data.matieres || [];
    let totalCoefficients = 0;
    let totalMoyennesCoeff = 0;

    matieres.forEach((matiere, index) => {
      const rowY = startY + headerHeight + (index * ligneHauteur);
      const bgColor = index % 2 === 0 ? 248 : 255;
      doc.setFillColor(bgColor, bgColor, bgColor);
      doc.rect(margin, rowY, contentWidth, ligneHauteur, 'F');

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      xPos = margin + 2;
      doc.text(matiere.matiere, xPos + 2, rowY + 5.5);
      xPos += cols[0].width;

      doc.text(BulletinPdfComponent.formatNombre(matiere.moyenneClasse), xPos + (cols[1].width / 2), rowY + 5.5, { align: 'center' });
      xPos += cols[1].width;

      doc.text(BulletinPdfComponent.formatNombre(matiere.noteCompo), xPos + (cols[2].width / 2), rowY + 5.5, { align: 'center' });
      xPos += cols[2].width;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 90, 160);
      doc.text(BulletinPdfComponent.formatNombre(matiere.moyenne), xPos + (cols[3].width / 2), rowY + 5.5, { align: 'center' });
      xPos += cols[3].width;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(String(matiere.coefficient), xPos + (cols[4].width / 2), rowY + 5.5, { align: 'center' });
      xPos += cols[4].width;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(BulletinPdfComponent.formatNombre(matiere.moyenneCoefficientee), xPos + (cols[5].width / 2), rowY + 5.5, { align: 'center' });
      xPos += cols[5].width;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(matiere.appreciation || '—', xPos + (cols[6].width / 2), rowY + 5.5, { align: 'center' });

      totalCoefficients += matiere.coefficient || 0;
      totalMoyennesCoeff += matiere.moyenneCoefficientee || 0;
    });

    const borderY = startY + headerHeight + (matieres.length * ligneHauteur);
    doc.setDrawColor(200, 210, 220);
    doc.line(margin, borderY, margin + contentWidth, borderY);

    data.totalCoefficients = totalCoefficients;
    data.totalMoyennesCoeff = totalMoyennesCoeff;
  }

  private static genererRecapitulatifStatic(doc: any, margin: number, contentWidth: number, data: BulletinData): void {
    const nbLignes = (data.matieres || []).length;
    const startY = 82 + 10 + (nbLignes * 8);

    // ============================================================================
    // Positions des colonnes (calculées à partir des largeurs dans le tableau)
    // Matière(45) + Moy.Classe(22) + Note/40(20) + Moy/20(18) = 105 (début colonne Coef)
    // Coef(14) → centre = 105 + 7 = 112
    // Coef(14) + Moy.Coef(22) = 126 (début colonne Appréciation)
    // Moy.Coef(22) → centre = 126 + 11 = 137
    // ============================================================================
    const coefX = margin + 112;  // Centre de la colonne Coef
    const moyCoefX = margin + 137; // Centre de la colonne Moy. Coef

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, startY, contentWidth, 16, 'F');

    doc.setDrawColor(200, 210, 220);
    doc.rect(margin, startY, contentWidth, 16, 'S');

    // Label "TOTAL" à gauche
    doc.setTextColor(44, 90, 160);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', margin + 5, startY + 10);

    // Total des coefficients - SOUS la colonne Coef
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(String(data.totalCoefficients), coefX, startY + 10, { align: 'center' });

    // Total des moyennes coefficiées - SOUS la colonne Moy. Coef
    doc.setTextColor(59, 130, 246);
    doc.setFont('helvetica', 'bold');
    doc.text(BulletinPdfComponent.formatNombre(data.totalMoyennesCoeff), moyCoefX, startY + 10, { align: 'center' });

    const startY2 = startY + 16;

    doc.setFillColor(44, 90, 160);
    doc.rect(margin, startY2, contentWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('MOYENNE DU TRIMESTRE :', margin + 5, startY2 + 8);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin + 60, startY2 + 2, 35, 8, 1, 1, 'F');

    doc.setTextColor(44, 90, 160);
    doc.text(
      BulletinPdfComponent.formatNombre(data.moyenneTrimestre) + ' / 20',
      margin + 77,
      startY2 + 7.5,
      { align: 'center' }
    );
  }

  private static genererSignaturesStatic(doc: any, pageWidth: number, pageHeight: number, margin: number): void {
    const startY = pageHeight - 50;
    const colWidth = (pageWidth - margin * 2) / 3;

    doc.setTextColor(44, 90, 160);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    doc.text('Professeur Principal', margin + colWidth / 2, startY, { align: 'center' });
    doc.text('Directeur', margin + colWidth * 1.5, startY, { align: 'center' });
    doc.text('Parent / Tuteur', margin + colWidth * 2.5, startY, { align: 'center' });

    const boxHeight = 25;

    doc.setDrawColor(180, 190, 200);
    doc.setFillColor(252, 252, 252);

    doc.roundedRect(margin + 2, startY + 3, colWidth - 4, boxHeight, 2, 2, 'FD');
    doc.roundedRect(margin + colWidth + 2, startY + 3, colWidth - 4, boxHeight, 2, 2, 'FD');
    doc.roundedRect(margin + colWidth * 2 + 2, startY + 3, colWidth - 4, boxHeight, 2, 2, 'FD');

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('', margin + colWidth / 2, startY + 17, { align: 'center' });
    doc.text('', margin + colWidth * 1.5, startY + 17, { align: 'center' });
    doc.text('', margin + colWidth * 2.5, startY + 17, { align: 'center' });
  }

  private static formatNombre(valeur: number | undefined): string {
    if (valeur === undefined || valeur === null) return '0.00';
    return valeur.toFixed(2);
  }
}

interface BulletinData {
  nomEcole: string;
  nom: string;
  prenoms: string;
  classe: string;
  trimestre: string;
  anneeScolaire: string;
  matieres: any[];
  moyenneTrimestre: number;
  totalCoefficients?: number;
  totalMoyennesCoeff?: number;
}