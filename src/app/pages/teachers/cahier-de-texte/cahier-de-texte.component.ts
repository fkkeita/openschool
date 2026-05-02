import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../core/layout/sidebar/sidebar.component';
import {
    SchoolDataService, Enseignant, LogbookEntry, Cycle, Annee, SlotConfig
} from '../../../core/services/school-data.service';

interface SubSlot {
    id: string;
    subject: string;
    teacherId: number | null;
    startTime: string;
    endTime: string;
    signed: boolean;
    lessonTitle: string;
}

@Component({
    selector: 'app-cahier-de-texte',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './cahier-de-texte.component.html',
    styleUrl: './cahier-de-texte.component.scss'
})
export class CahierDeTexteComponent implements OnInit {
    public schoolData = inject(SchoolDataService);

    // ─── Accueil ───
    public rechercheAccueil = '';
    public cycleOuvert: Record<string, boolean> = {};
    public selectedAnnee: Annee | null = null;
    public selectedClasse: string | null = null;
    public showClasseModal = false;

    // ─── Semaine ───
    public currentMonday: Date = new Date();
    public weekDates: Date[] = [];
    public selectedDateStr = '';
    public visibleDays: string[] = [];
    private allDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    // ─── Grille horaire (identique à l’emploi du temps) ───
    public customSlots: SlotConfig[] = [];

    // ─── Données des cours (même structure que currentTimetable) ───
    public currentTimetable: Record<string, Record<number, { subSlots: SubSlot[] }>> = {};

    public isCurrentWeek = false;
    public unsignedTodayCount = 0;

    // Modales
    public showSignModal = false;
    public showEditModal = false;
    public showTeachersModal = false;
    public signContext: { dayIdx: number; slotId: string; sub: SubSlot } | null = null;
    public editContext: { dayIdx: number; slotId: string; sub: SubSlot } | null = null;
    public editModeTitle = 'Modifier le cours';
    public editTeacherId: number | null = null;
    public editSubject = '';
    public lessonTitleForm = '';

    public newTeacherName = '';
    public newTeacherRate = 2000;

    get cycles(): Cycle[] { return this.schoolData.cycles; }
    get enseignants(): Enseignant[] { return this.schoolData.enseignants; }

    ngOnInit(): void {
        this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);
        this.applyDaysConfiguration();
        this.currentMonday = this.getMonday(new Date());
        this.updateWeekDates();
        this.selectedDateStr = this.formatDateIso(new Date());
    }

    applyDaysConfiguration(): void {
        this.visibleDays = this.schoolData.includeSamedi ? [...this.allDays] : this.allDays.slice(0, 5);
    }

    // ══════════ ACCUEIL ══════════
    basculerCycle(nom: string): void { this.cycleOuvert[nom] = !this.cycleOuvert[nom]; }

    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        const t = this.rechercheAccueil.toLowerCase();
        return cycle.annees.filter(a => a.nom.toLowerCase().includes(t) || a.description.toLowerCase().includes(t));
    }

    statsPourAnnee(anneeNom: string): { nbEleves: number; nbClasses: number; presence: number; classes: string[] } {
        const classes = this.schoolData.classesPourAnnee(anneeNom);
        return {
            nbEleves: Math.floor(Math.random() * 20) + 30,
            nbClasses: classes.length,
            presence: Math.floor(Math.random() * 20) + 75,
            classes: classes
        };
    }

    getClassesForSelectedAnnee(): string[] {
        return this.selectedAnnee ? this.schoolData.classesPourAnnee(this.selectedAnnee.nom) : [];
    }

    selectAnnee(annee: Annee): void { this.selectedAnnee = annee; this.showClasseModal = true; }

    selectClasse(classe: string): void {
        this.selectedClasse = classe;
        // Récupère la grille horaire sauvegardée pour cette classe
        this.customSlots = this.schoolData.getCustomSlots(classe);
        this.showClasseModal = false;
        this.currentMonday = this.getMonday(new Date());
        this.updateWeekDates();
        this.loadWeekData();
    }

    resetSelection(): void { this.selectedClasse = null; this.selectedAnnee = null; }

    onRechercheAccueilChange(val: string): void { this.rechercheAccueil = val; }

    // ══════════ DATES ══════════
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

    changeWeek(offset: number): void {
        this.currentMonday.setDate(this.currentMonday.getDate() + offset * 7);
        this.updateWeekDates(); this.loadWeekData();
    }

    onDatePickerChange(event: any): void {
        const d = new Date(event.target.value);
        if (!isNaN(d.getTime())) {
            this.currentMonday = this.getMonday(d);
            this.updateWeekDates(); this.loadWeekData();
        }
    }

    // ══════════ CHARGEMENT (identique emploi du temps) ══════════
    loadWeekData(): void {
        if (!this.selectedClasse) return;
        // Initialise la structure avec les subSlots
        this.currentTimetable = {};
        for (const slot of this.customSlots) {
            if (slot.isPause) continue;
            this.currentTimetable[slot.id] = {};
            for (let d = 0; d < this.visibleDays.length; d++) {
                this.currentTimetable[slot.id][d] = { subSlots: [] };
            }
        }

        const entries = this.schoolData.logbookEntries.filter(e => e.classe === this.selectedClasse);

        // Remplit les créneaux avec les cours correspondants
        for (let d = 0; d < this.visibleDays.length; d++) {
            const dateStr = this.formatDateIso(this.weekDates[d]);
            for (const slot of this.customSlots) {
                if (slot.isPause) continue;
                const cellEntries = entries.filter(e => e.date === dateStr &&
                    e.slot.split(' - ')[0] >= slot.startTime &&
                    e.slot.split(' - ')[1] <= slot.endTime
                );
                if (cellEntries.length > 0) {
                    // Trie par heure de début
                    cellEntries.sort((a, b) => a.slot.split(' - ')[0].localeCompare(b.slot.split(' - ')[0]));
                    this.currentTimetable[slot.id][d].subSlots = cellEntries.map(e => ({
                        id: e.id,
                        subject: e.subject,
                        teacherId: e.teacherId || null,
                        startTime: e.slot.split(' - ')[0],
                        endTime: e.slot.split(' - ')[1],
                        signed: e.signed,
                        lessonTitle: e.lessonTitle || ''
                    }));
                } else {
                    // Créneau vide : un subSlot par défaut
                    this.currentTimetable[slot.id][d].subSlots = [{
                        id: `empty_${slot.id}_${d}`,
                        subject: '',
                        teacherId: null,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        signed: false,
                        lessonTitle: ''
                    }];
                }
            }
        }

        this.isCurrentWeek = this.currentMonday.getTime() === this.getMonday(new Date()).getTime();
        this.updateUnsignedCount();
    }

    /** Retourne les subSlots d'un créneau pour un jour donné (utilisé dans le template) */
    getCoursDuCreneau(slotId: string, dayIdx: number): SubSlot[] {
        return this.currentTimetable[slotId]?.[dayIdx]?.subSlots || [];
    }

    isToday(dayIdx: number): boolean {
        if (!this.weekDates[dayIdx]) return false;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const d = new Date(this.weekDates[dayIdx]); d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    }

    updateUnsignedCount(): void {
        if (!this.isCurrentWeek) { this.unsignedTodayCount = 0; return; }
        const todayIdx = this.weekDates.findIndex(d => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const dNorm = new Date(d); dNorm.setHours(0, 0, 0, 0);
            return dNorm.getTime() === today.getTime();
        });
        if (todayIdx === -1) { this.unsignedTodayCount = 0; return; }
        let count = 0;
        for (const slot of this.customSlots) {
            if (slot.isPause) continue;
            const subs = this.getCoursDuCreneau(slot.id, todayIdx);
            for (const sub of subs) {
                if (sub.subject && !sub.signed) count++;
            }
        }
        this.unsignedTodayCount = count;
    }

    // ══════════ SIGNATURE ══════════
    openSignModal(dayIdx: number, slot: SlotConfig, sub: SubSlot): void {
        if (!this.isCurrentWeek || !this.isToday(dayIdx) || sub.signed) return;
        this.signContext = { dayIdx, slotId: slot.id, sub };
        this.lessonTitleForm = '';
        this.showSignModal = true;
    }

    confirmSignature(): void {
        if (!this.signContext || !this.lessonTitleForm.trim()) return;
        const { dayIdx, slotId, sub } = this.signContext;
        const dateStr = this.formatDateIso(this.weekDates[dayIdx]);
        const entry = this.schoolData.logbookEntries.find(e =>
            e.classe === this.selectedClasse && e.date === dateStr &&
            e.slot === `${sub.startTime} - ${sub.endTime}`
        );
        if (entry) {
            entry.signed = true;
            entry.lessonTitle = this.lessonTitleForm.trim();
            this.schoolData.saveLogbook();
            sub.signed = true;
            sub.lessonTitle = entry.lessonTitle;
            this.showSignModal = false;
            this.updateUnsignedCount();
        }
    }

    // ══════════ ÉDITION ══════════
    openEditModal(dayIdx: number, slot: SlotConfig, sub: SubSlot): void {
        if (!this.isCurrentWeek || !this.isToday(dayIdx) || sub.signed) return;
        this.editContext = { dayIdx, slotId: slot.id, sub };
        this.editModeTitle = sub.subject ? 'Modifier le cours' : 'Remplir le créneau';
        this.editTeacherId = sub.teacherId;
        this.editSubject = sub.subject;
        this.showEditModal = true;
    }

    confirmEdit(): void {
        if (!this.editContext || !this.editSubject.trim()) return;
        const { dayIdx, slotId, sub } = this.editContext;
        const dateStr = this.formatDateIso(this.weekDates[dayIdx]);
        const slotStr = `${sub.startTime} - ${sub.endTime}`;
        // Supprime l'ancienne entrée correspondante
        const oldIdx = this.schoolData.logbookEntries.findIndex(e =>
            e.classe === this.selectedClasse && e.date === dateStr && e.slot === slotStr
        );
        if (oldIdx !== -1) this.schoolData.logbookEntries.splice(oldIdx, 1);
        // Crée la nouvelle entrée
        const newEntry: LogbookEntry = {
            id: `${dateStr}_${slotStr}_${this.selectedClasse}`,
            date: dateStr, slot: slotStr,
            teacherId: this.editTeacherId || 0,
            subject: this.editSubject.trim(),
            classe: this.selectedClasse!,
            lessonTitle: '',
            signed: false,
            valide: false
        };
        this.schoolData.logbookEntries.push(newEntry);
        this.schoolData.saveLogbook();
        // Met à jour localement le subSlot
        sub.subject = newEntry.subject;
        sub.teacherId = newEntry.teacherId || null;
        sub.signed = false;
        sub.lessonTitle = '';
        this.showEditModal = false;
        this.updateUnsignedCount();
    }

    // ══════════ PROFESSEURS ══════════
    getSignedHoursForTeacher(teacherId: number): number {
        return this.schoolData.logbookEntries.filter(e => e.teacherId === teacherId && e.signed).length;
    }

    getTeacherSalary(teacher: Enseignant): number {
        return this.getSignedHoursForTeacher(teacher.id) * (teacher.hourlyRate || 0);
    }

    addTeacher(): void {
        if (!this.newTeacherName) return;
        const [prenom, ...nomParts] = this.newTeacherName.split(' ');
        const nouveau: Enseignant = {
            id: Math.max(0, ...this.enseignants.map(e => e.id)) + 1,
            prenom: prenom,
            nom: nomParts.join(' ') || '',
            email: '', telephone: '', matierePrincipale: '',
            grade: 'Contractuel', dateEmbauche: new Date().toISOString().split('T')[0],
            hourlyRate: this.newTeacherRate,
            affectations: []
        };
        this.schoolData.enseignants.push(nouveau);
        this.newTeacherName = '';
        this.newTeacherRate = 2000;
    }

    deleteTeacher(id: number): void {
        this.schoolData.enseignants = this.schoolData.enseignants.filter(e => e.id !== id);
        this.schoolData.logbookEntries = this.schoolData.logbookEntries.filter(e => e.teacherId !== id);
        this.schoolData.saveLogbook();
        this.loadWeekData();
    }

    updateTeacherRate(teacher: Enseignant): void {
        // La mise à jour est directement faite dans le template via [(ngModel)]
    }

    getTeacherName(id: number | null | undefined): string {
        if (id == null) return 'Non assigné';
        const e = this.enseignants.find(t => t.id === id);
        return e ? `${e.prenom} ${e.nom}` : 'Inconnu';
    }

    // ══════════ RÉINITIALISATION ══════════
    resetWeek(): void {
        if (!confirm('Supprimer tous les cours non signés de cette semaine ?')) return;
        for (let d = 0; d < this.weekDates.length; d++) {
            const dateStr = this.formatDateIso(this.weekDates[d]);
            const toRemove = this.schoolData.logbookEntries.filter(
                e => e.classe === this.selectedClasse && e.date === dateStr && !e.signed
            );
            toRemove.forEach(e => {
                const idx = this.schoolData.logbookEntries.indexOf(e);
                if (idx > -1) this.schoolData.logbookEntries.splice(idx, 1);
            });
        }
        this.schoolData.saveLogbook();
        this.loadWeekData();
    }
}