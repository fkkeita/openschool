import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import {
    SchoolDataService, Enseignant, Cycle, Annee, LogbookEntry, SlotConfig
} from '../../core/services/school-data.service';

interface SubSlot {
    id: string;
    subject: string;
    teacherId: number | null;
    startTime: string;
    endTime: string;
}

@Component({
    selector: 'app-timetable',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './timetable.component.html',
    styleUrl: './timetable.component.scss'
})
export class TimetableComponent implements OnInit {

    private schoolData = inject(SchoolDataService);

    public allDays: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    public visibleDays: string[] = [];

    public includeSamedi: boolean = true;

    public customSlots: SlotConfig[] = [];

    public rechercheAccueil = '';
    public cycleOuvert: Record<string, boolean> = {};

    public mode: 'home' | 'gerer' | 'voir' | 'gerer-picker' = 'home';
    public selectedAnnee: Annee | null = null;
    public selectedClasse: string | null = null;

    public voirAnnee: Annee | null = null;
    public showVoirModal = false;

    public currentMonday: Date = new Date();
    public weekDates: Date[] = [];
    public selectedDateStr = '';

    public currentTimetable: Record<string, Record<number, { subSlots: SubSlot[] }>> = {};

    public showSlotConfigModal = false;
    public editableSlots: SlotConfig[] = [];

    get cycles(): Cycle[] { return this.schoolData.cycles; }
    get enseignants(): Enseignant[] { return this.schoolData.enseignants; }

    ngOnInit(): void {
        this.includeSamedi = this.schoolData.includeSamedi;
        this.applyDays();
        this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);
        this.currentMonday = this.getMonday(new Date());
        this.updateWeekDates();
        this.selectedDateStr = this.formatDateIso(new Date());
        this.customSlots = this.schoolData.getCustomSlots(this.selectedClasse || '');
        this.currentTimetable = this.createEmptyTimetable();
    }

    applyDays(): void {
        this.visibleDays = this.includeSamedi ? [...this.allDays] : this.allDays.slice(0, 5);
    }

    /** Toggle samedi en un seul clic (via (change) dans le template) */
    onToggleSamedi(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.includeSamedi = checked;
        this.schoolData.includeSamedi = this.includeSamedi;
        this.applyDays();
        this.updateWeekDates();
        this.currentTimetable = this.createEmptyTimetable();
        this.loadWeekData();
    }

    // ═══════════ ACCUEIL ═══════════
    basculerCycle(cycleNom: string): void {
        this.cycleOuvert[cycleNom] = !this.cycleOuvert[cycleNom];
    }

    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        const t = this.rechercheAccueil.toLowerCase();
        return cycle.annees.filter(a =>
            a.nom.toLowerCase().includes(t) || a.description.toLowerCase().includes(t)
        );
    }

    statsPourAnnee(anneeNom: string): { nbEnseignants: number; nbClasses: number; nbMatieres: number; classes: string[] } {
        const classes = this.schoolData.classesPourAnnee(anneeNom);
        const ensIds = new Set<number>();
        const matNoms = new Set<string>();
        classes.forEach(c => {
            this.schoolData.enseignantsPourClasse(c).forEach(e => {
                ensIds.add(e.id);
                e.affectations.filter(a => a.classe === c).forEach(a => matNoms.add(a.matiere));
            });
        });
        return { nbEnseignants: ensIds.size, nbClasses: classes.length, nbMatieres: matNoms.size, classes };
    }

    // ═══════════ NAVIGATION ═══════════
    ouvrirGerer(annee: Annee): void {
        this.selectedAnnee = annee;
        this.mode = 'gerer-picker';
    }

    ouvrirVoir(annee: Annee): void {
        this.voirAnnee = annee;
        this.showVoirModal = true;
    }

    getClassesAnnee(annee: Annee | null): string[] {
        if (!annee) return [];
        return this.schoolData.classesPourAnnee(annee.nom);
    }

    selectClasseGerer(classe: string): void {
        this.selectedClasse = classe;
        this.customSlots = this.schoolData.getCustomSlots(classe);
        this.mode = 'gerer';
        this.loadWeekData();
    }

    selectClasseVoir(classe: string): void {
        this.selectedClasse = classe;
        this.customSlots = this.schoolData.getCustomSlots(classe);
        this.showVoirModal = false;
        this.loadWeekData();
        this.mode = 'voir';
    }

    retourAccueil(): void {
        this.mode = 'home';
        this.selectedClasse = null;
        this.selectedAnnee = null;
        this.voirAnnee = null;
    }

    // ═══════════ DATES ═══════════
    getMonday(d: Date): Date {
        const date = new Date(d);
        const day = date.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
    }

    updateWeekDates(): void {
        this.weekDates = [];
        const nbJours = this.visibleDays.length;
        for (let i = 0; i < nbJours; i++) {
            const d = new Date(this.currentMonday);
            d.setDate(d.getDate() + i);
            this.weekDates.push(d);
        }
    }

    formatDateIso(d: Date): string { return d.toISOString().split('T')[0]; }

    nextWeek(): void {
        this.currentMonday.setDate(this.currentMonday.getDate() + 7);
        this.updateWeekDates(); this.loadWeekData();
    }

    previousWeek(): void {
        this.currentMonday.setDate(this.currentMonday.getDate() - 7);
        this.updateWeekDates(); this.loadWeekData();
    }

    onDateSelected(event: any): void {
        const d = new Date(event.target.value);
        if (!isNaN(d.getTime())) {
            this.currentMonday = this.getMonday(d);
            this.updateWeekDates(); this.loadWeekData();
        }
    }

    // ═══════════ GESTION DE L'EMPLOI DU TEMPS ═══════════
    createEmptyTimetable(): Record<string, Record<number, { subSlots: SubSlot[] }>> {
        const table: Record<string, Record<number, { subSlots: SubSlot[] }>> = {};
        const nbJours = this.visibleDays.length;
        for (const slot of this.customSlots) {
            if (slot.isPause) continue;
            table[slot.id] = {};
            for (let d = 0; d < nbJours; d++) {
                table[slot.id][d] = {
                    subSlots: [{
                        id: `sub_${slot.id}_${d}_0`,
                        subject: '',
                        teacherId: null,
                        startTime: slot.startTime,
                        endTime: slot.endTime
                    }]
                };
            }
        }
        return table;
    }

    loadWeekData(): void {
        if (!this.selectedClasse) return;
        this.currentTimetable = this.createEmptyTimetable();

        const entriesByCell = new Map<string, any[]>();
        const nbJours = this.visibleDays.length;

        this.schoolData.logbookEntries.forEach((entry: LogbookEntry) => {
            if (entry.classe !== this.selectedClasse) return;
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            const diffDays = Math.round((entryDate.getTime() - this.currentMonday.getTime()) / 86400000);

            if (diffDays >= 0 && diffDays < nbJours) {
                const parts = entry.slot.split(' - ');
                if (parts.length === 2) {
                    const eStart = parts[0];
                    const eEnd = parts[1];
                    const globalSlot = this.customSlots.find(s =>
                        !s.isPause && s.startTime <= eStart && s.endTime >= eEnd
                    );
                    if (globalSlot) {
                        const key = `${globalSlot.id}_${diffDays}`;
                        if (!entriesByCell.has(key)) entriesByCell.set(key, []);
                        entriesByCell.get(key)!.push({ ...entry, eStart, eEnd });
                    }
                }
            }
        });

        entriesByCell.forEach((entries, key) => {
            const parts = key.split('_');
            const dayIdx = parseInt(parts[parts.length - 1], 10);
            const slotId = parts.slice(0, parts.length - 1).join('_');

            entries.sort((a, b) => a.eStart.localeCompare(b.eStart));

            if (this.currentTimetable[slotId] && this.currentTimetable[slotId][dayIdx]) {
                this.currentTimetable[slotId][dayIdx].subSlots = entries.map((e: any) => ({
                    id: 'sub_' + Date.now() + Math.random(),
                    subject: e.subject,
                    teacherId: Number(e.teacherId),
                    startTime: e.eStart,
                    endTime: e.eEnd
                }));
            }
        });
    }

    splitSlot(slotId: string, dayIndex: number): void {
        const cell = this.currentTimetable[slotId][dayIndex];
        const lastSub = cell.subSlots[cell.subSlots.length - 1];

        const parseTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const formatTime = (m: number) => {
            const h = Math.floor(m / 60);
            const min = m % 60;
            return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        };

        const startMins = parseTime(lastSub.startTime);
        const endMins = parseTime(lastSub.endTime);
        if (endMins - startMins <= 15) return;

        const midMins = Math.floor((startMins + endMins) / 2);
        const midStr = formatTime(midMins);

        lastSub.endTime = midStr;
        cell.subSlots.push({
            id: 'sub_' + Date.now() + Math.random(),
            subject: '',
            teacherId: null,
            startTime: midStr,
            endTime: formatTime(endMins)
        });
    }

    removeSubSlot(slotId: string, dayIndex: number, subIndex: number): void {
        const cell = this.currentTimetable[slotId][dayIndex];
        if (cell.subSlots.length <= 1) return;

        const removed = cell.subSlots[subIndex];
        if (subIndex > 0) {
            cell.subSlots[subIndex - 1].endTime = removed.endTime;
        } else {
            cell.subSlots[subIndex + 1].startTime = removed.startTime;
        }
        cell.subSlots.splice(subIndex, 1);
    }

    saveCurrentWeek(): void {
        if (!this.selectedClasse) return;

        const nbJours = this.visibleDays.length;
        for (let d = 0; d < nbJours; d++) {
            const dateStr = this.formatDateIso(this.weekDates[d]);

            for (const slot of this.customSlots) {
                if (slot.isPause) continue;
                const cell = this.currentTimetable[slot.id][d];

                // Supprime les anciennes entrées non signées pour ce créneau
                const toRemove = this.schoolData.logbookEntries.filter((e: LogbookEntry) => {
                    if (e.classe !== this.selectedClasse || e.date !== dateStr || e.signed) return false;
                    const parts = e.slot.split(' - ');
                    return parts.length === 2 && parts[0] >= slot.startTime && parts[1] <= slot.endTime;
                });
                toRemove.forEach((e: LogbookEntry) => {
                    const idx = this.schoolData.logbookEntries.indexOf(e);
                    if (idx > -1) this.schoolData.logbookEntries.splice(idx, 1);
                });

                // Ajoute les nouveaux sous-créneaux
                for (const sub of cell.subSlots) {
                    if (sub.subject || sub.teacherId) {
                        this.schoolData.logbookEntries.push({
                            id: `${dateStr}_${sub.id}_${this.selectedClasse}`,
                            date: dateStr,
                            slot: `${sub.startTime} - ${sub.endTime}`,
                            teacherId: sub.teacherId ? Number(sub.teacherId) : 0,
                            subject: sub.subject,
                            classe: this.selectedClasse,
                            lessonTitle: '',
                            signed: false,
                            valide: false
                        });
                    }
                }
            }
        }
        this.schoolData.saveLogbook();
        // Sauvegarde aussi la grille horaire personnalisée pour cette classe
        this.schoolData.setCustomSlots(this.selectedClasse, this.customSlots);

        // Proposer le téléchargement PDF
        if (confirm('✅ Emploi du temps sauvegardé avec succès.\nVoulez-vous télécharger le PDF maintenant ?')) {
            this.downloadPDF();
        }
    }

    resetCurrentWeek(): void {
        if (!confirm('Vider toute la semaine (supprimera les cours non signés) ?')) return;
        const nbJours = this.visibleDays.length;
        for (let d = 0; d < nbJours; d++) {
            const dateStr = this.formatDateIso(this.weekDates[d]);
            for (const slot of this.customSlots) {
                if (slot.isPause) continue;
                const entries = this.schoolData.logbookEntries.filter((e: LogbookEntry) => {
                    if (e.classe !== this.selectedClasse || e.date !== dateStr || e.signed) return false;
                    const parts = e.slot.split(' - ');
                    return parts.length === 2 && parts[0] >= slot.startTime && parts[1] <= slot.endTime;
                });
                entries.forEach((e: LogbookEntry) => {
                    const idx = this.schoolData.logbookEntries.indexOf(e);
                    if (idx > -1) this.schoolData.logbookEntries.splice(idx, 1);
                });
            }
        }
        this.schoolData.saveLogbook();
        this.loadWeekData();
    }

    // ═══════════ COHÉRENCE DES DONNÉES ═══════════
    getMatieresClasse(): string[] {
        if (!this.selectedClasse) return [];
        const matieres = new Set<string>();
        this.schoolData.enseignantsPourClasse(this.selectedClasse).forEach(e => {
            e.affectations
                .filter(a => a.classe === this.selectedClasse)
                .forEach(a => matieres.add(a.matiere));
        });
        return Array.from(matieres).sort();
    }

    getEnseignantsPourMatiere(matiere: string): Enseignant[] {
        if (!matiere || !this.selectedClasse) return [];
        return this.schoolData.enseignantsPourClasse(this.selectedClasse)
            .filter(e => e.affectations.some(a => a.classe === this.selectedClasse && a.matiere === matiere));
    }

    onSubjectChange(slotId: string, dayIndex: number, subIndex: number, newSubject: string): void {
        const sub = this.currentTimetable[slotId][dayIndex].subSlots[subIndex];
        sub.subject = newSubject;
        const profsDispos = this.getEnseignantsPourMatiere(newSubject);
        if (sub.teacherId && !profsDispos.some(p => p.id === sub.teacherId)) {
            sub.teacherId = profsDispos.length === 1 ? profsDispos[0].id : null;
        } else if (!sub.teacherId && profsDispos.length === 1) {
            sub.teacherId = profsDispos[0].id;
        }
    }

    onTeacherChange(slotId: string, dayIndex: number, subIndex: number, val: any): void {
        this.currentTimetable[slotId][dayIndex].subSlots[subIndex].teacherId = val;
    }

    nomEnseignant(id: number | null): string {
        if (!id) return '';
        const e = this.enseignants.find(t => t.id === id);
        return e ? (e.fullName || `${e.prenom} ${e.nom}`) : '';
    }

    // ═══════════ CONFIGURATION DES HORAIRES ═══════════
    openSlotConfig(): void {
        this.editableSlots = this.customSlots.map(s => ({ ...s }));
        this.showSlotConfigModal = true;
    }

    closeSlotConfig(): void {
        this.showSlotConfigModal = false;
    }

    addSlot(): void {
        const newSlot: SlotConfig = {
            id: 'slot_' + Date.now() + Math.random().toString(36).substr(2, 5),
            startTime: '08:00',
            endTime: '09:00',
            isPause: false
        };
        this.editableSlots.push(newSlot);
    }

    removeSlot(index: number): void {
        this.editableSlots.splice(index, 1);
    }

    moveSlotUp(index: number): void {
        if (index > 0) {
            [this.editableSlots[index - 1], this.editableSlots[index]] =
                [this.editableSlots[index], this.editableSlots[index - 1]];
        }
    }

    moveSlotDown(index: number): void {
        if (index < this.editableSlots.length - 1) {
            [this.editableSlots[index], this.editableSlots[index + 1]] =
                [this.editableSlots[index + 1], this.editableSlots[index]];
        }
    }

    saveSlotConfig(): void {
        for (let slot of this.editableSlots) {
            if (slot.startTime >= slot.endTime) {
                alert('Erreur : l\'heure de début doit être inférieure à l\'heure de fin pour chaque créneau.');
                return;
            }
        }

        this.customSlots = this.editableSlots.map(s => ({ ...s }));
        this.closeSlotConfig();

        if (confirm('⚠️ La nouvelle grille horaire va réinitialiser les cours de la semaine. Continuer ?')) {
            this.currentTimetable = this.createEmptyTimetable();
            alert('✅ Grille horaire mise à jour. Vous pouvez maintenant éditer les cours.');
        } else {
            this.loadWeekData();
        }
    }

    // ═══════════ TÉLÉCHARGEMENT PDF ═══════════
    downloadPDF(): void {
        const semaine = `Semaine du ${this.weekDates[0].toLocaleDateString('fr-FR')} au ${this.weekDates[this.weekDates.length - 1].toLocaleDateString('fr-FR')}`;
        let html = `<html><head><title>Emploi du temps ${this.selectedClasse}</title>
            <style>
                @page { size: landscape; margin: 5mm; }
                body { font-family: sans-serif; font-size: 10px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 4px; text-align: center; vertical-align: top; }
                .th-day { background: #f1f5f9; font-weight: bold; }
                .td-slot { background: #f8fafc; font-weight: bold; }
                .pause-row { background: #fef9c3; }
                .cell-filled { background: #f0f4ff; } /* sans bordure gauche */
                .sub-separator { border-top: 1px dashed #94a3b8; margin: 2px 0; }
            </style>
        </head><body>
        <h2>Emploi du temps - ${this.selectedClasse}</h2>
        <h3>${semaine}</h3>
        <table><thead><tr><th>Horaires</th>`;
        this.visibleDays.forEach((day, idx) => {
            html += `<th class="th-day">${day}<br>${this.weekDates[idx].toLocaleDateString('fr-FR')}</th>`;
        });
        html += `</tr></thead><tbody>`;
        for (const slot of this.customSlots) {
            if (slot.isPause) {
                html += `<tr class="pause-row"><td class="td-slot">${slot.name || 'Pause'}</td>`;
                for (let d = 0; d < this.visibleDays.length; d++) {
                    html += `<td>${slot.name || 'Pause'}</td>`;
                }
                html += `</tr>`;
            } else {
                html += `<tr><td class="td-slot">${slot.startTime} – ${slot.endTime}</td>`;
                for (let d = 0; d < this.visibleDays.length; d++) {
                    const subs = this.currentTimetable[slot.id]?.[d]?.subSlots || [];
                    html += `<td>`;
                    subs.forEach((sub, idx) => {
                        if (sub.subject) {
                            html += `<div class="cell-filled"><b>${sub.subject}</b><br>${this.nomEnseignant(sub.teacherId)}</div>`;
                        } else {
                            html += `<div>—</div>`;
                        }
                        if (idx < subs.length - 1) html += `<div class="sub-separator"></div>`;
                    });
                    html += `</td>`;
                }
                html += `</tr>`;
            }
        }
        html += `</tbody></table></body></html>`;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument?.write(html);
        iframe.contentDocument?.close();
        iframe.onload = () => {
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        };
    }
}