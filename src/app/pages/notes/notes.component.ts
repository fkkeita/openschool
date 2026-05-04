import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { SchoolDataService, Cycle, Annee, Eleve } from '../../core/services/school-data.service';

// ─── Interfaces locales (inchangées) ──────────────────────────
interface NoteEntry {
    id: number;
    eleveId: number;
    matiere: string;
    type: 'devoir' | 'interrogation' | 'trimestre' | 'composition' | 'examen';
    titre: string;
    note: number;
    coefficient?: number;
    date: string;
}

interface EvenementCollectif {
    id: number;
    classe: string;
    type: 'trimestre' | 'composition' | 'examen';
    titre: string;
    date: string;
    matieres: string[];
}

interface NoteTrimestre {
    id: number;
    eleveId: number;
    trimestreId: number;
    matiere: string;
    moyenneClasse: number;
    noteCompo: number;
    moyenne: number;
    coefficient: number;
    moyenneCoefficientee: number;
    appreciation: string;
    date: string;
}

interface FormDevoir {
    titre: string;
    type: 'devoir' | 'interrogation';
    matiere: string;
    date: string;
}

interface FormTrimestre {
    titre: string;
    type: 'trimestre' | 'composition' | 'examen';
    date: string;
    matieres: string[];
}

interface LigneAttributionTrimestre {
    matiere: string;
    moyenneClasse: number;
    noteCompo: number;
    moyenne: number;
    coefficient: number;
    moyenneCoefficientee: number;
    appreciation: string;
}

interface AttributionTrimestreState {
    opened: boolean;
    trimestreId: number;
    eleveIndex: number;
    eleves: Eleve[];
}

@Component({
    selector: 'app-notes',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './notes.component.html',
    styleUrl: './notes.component.scss'
})
export class NotesComponent implements OnInit {

    private schoolData = inject(SchoolDataService);

    // Navigation
    public rechercheAccueil = '';
    public cycleOuvert: Record<string, boolean> = {};

    // Mode
    public mode: 'home' | 'gerer' | 'voir' | 'gerer-picker' = 'home';
    public selectedAnnee: Annee | null = null;
    public selectedClasse: string | null = null;

    // Popups
    public showVoirModal = false;
    public voirAnnee: Annee | null = null;
    public showElevesModal: Eleve[] | null = null;
    public selectedEleve: Eleve | null = null;
    public showGererClasseModal: string | null = null;
    public showCreateDevoirModal = false;
    public showCreateEvenementModal = false;
    public showAttribuerNotesModal: { type: string; titre: string; evenementId?: number } | null = null;
    public showAttribuerTrimestreModal = false;

    // Stores de notes
    public notesStore: Map<number, NoteEntry[]> = new Map();
    public notesTrimestreStore: Map<number, NoteTrimestre[]> = new Map();
    public evenements: EvenementCollectif[] = [];

    // Formulaires
    public formDevoir: FormDevoir = this.creerFormDevoirVide();
    public formTrimestre: FormTrimestre = this.creerFormTrimestreVide();
    public formAttribuer: { eleveId: number; note: number }[] = [];
    public formAttribuerTrimestre: LigneAttributionTrimestre[] = [];

    // ═══════════════ ACCESSEURS ═══════════════
    get cycles(): Cycle[] { return this.schoolData.cycles; }

    get classesListe(): string[] {
        return this.schoolData.toutesLesClasses();
    }

    // ═══════════════ INITIALISATION ═══════════════
    ngOnInit(): void {
        this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);
        // Les élèves sont déjà chargés par le service, pas d'initialisation locale.
    }

    // ─── Helpers ────────────────────────────────────
    private creerFormDevoirVide(): FormDevoir {
        return { titre: '', type: 'devoir', matiere: '', date: new Date().toISOString().split('T')[0] };
    }
    private creerFormTrimestreVide(): FormTrimestre {
        return { titre: '', type: 'trimestre', date: new Date().toISOString().split('T')[0], matieres: [] };
    }

    basculerCycle(nom: string): void { this.cycleOuvert[nom] = !this.cycleOuvert[nom]; }

    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        const t = this.rechercheAccueil.toLowerCase();
        return cycle.annees.filter(a => a.nom.toLowerCase().includes(t) || a.description.toLowerCase().includes(t));
    }

    statsPourAnnee(anneeNom: string): any {
        const classes = this.schoolData.classesPourAnnee(anneeNom);
        return {
            nbClasses: classes.length,
            nbEleves: classes.reduce((sum, c) => sum + this.schoolData.elevesPourClasse(c).length, 0),
            classes
        };
    }

    getClassesAnnee(annee: Annee | null): string[] {
        return annee ? this.schoolData.classesPourAnnee(annee.nom) : [];
    }

    getMatieresClasse(classe: string): string[] {
        return classe ? this.schoolData.matieresPourClasse(classe).map(m => m.matiere) : [];
    }

    getEleveName(id: number): string {
        const eleve = this.schoolData.tousLesEleves.find(e => e.id === id);
        return eleve ? `${eleve.prenom} ${eleve.nom}` : '';
    }

    // ═══════════════ VOIR LES NOTES ═══════════════
    ouvrirVoir(annee: Annee): void {
        this.voirAnnee = annee;
        this.showVoirModal = true;
    }

    selectClasseVoir(classe: string): void {
        this.showVoirModal = false;
        this.selectedClasse = classe;
        this.showElevesModal = this.schoolData.elevesPourClasse(classe);
    }

    fermerElevesModal(): void {
        this.showElevesModal = null;
        this.selectedClasse = null;
    }

    selectEleve(eleve: Eleve): void {
        this.selectedEleve = eleve;
        this.showElevesModal = null;
    }

    fermerNotesEleve(): void {
        this.selectedEleve = null;
    }

    getNotesEleve(eleveId: number): NoteEntry[] {
        return this.notesStore.get(eleveId) || [];
    }

    // ═══════════════ GÉRER ═══════════════
    ouvrirGerer(annee: Annee): void {
        this.selectedAnnee = annee;
        this.mode = 'gerer-picker';
    }

    selectClasseGerer(classe: string): void {
        this.selectedClasse = classe;
        this.showGererClasseModal = classe;
    }

    fermerGererClasseModal(): void {
        this.showGererClasseModal = null;
        this.selectedClasse = null;
    }

    // ═══════════════ CRÉATION DEVOIR / INTERRO ═══════════════
    ouvrirCreationDevoir(): void {
        this.formDevoir = this.creerFormDevoirVide();
        this.showCreateDevoirModal = true;
    }

    creerDevoir(): void {
        if (!this.formDevoir.titre || !this.formDevoir.matiere) return;
        this.showCreateDevoirModal = false;
        this.ouvrirAttribuerNotes(this.formDevoir.type, this.formDevoir.titre);
    }

    // ═══════════════ CRÉATION TRIMESTRE / COMPO / EXAMEN ═══════════════
    ouvrirCreationEvenement(): void {
        this.formTrimestre = this.creerFormTrimestreVide();
        this.showCreateEvenementModal = true;
    }

    toggleMatiereTrimestre(matiere: string): void {
        const index = this.formTrimestre.matieres.indexOf(matiere);
        index === -1 ? this.formTrimestre.matieres.push(matiere) : this.formTrimestre.matieres.splice(index, 1);
    }

    isMatiereSelected(matiere: string): boolean {
        return this.formTrimestre.matieres.includes(matiere);
    }

    enregistrerEvenement(): void {
        if (!this.formTrimestre.titre || !this.selectedClasse || this.formTrimestre.matieres.length === 0) return;
        const evenement: EvenementCollectif = {
            id: Date.now(),
            classe: this.selectedClasse,
            type: this.formTrimestre.type,
            titre: this.formTrimestre.titre,
            date: this.formTrimestre.date,
            matieres: [...this.formTrimestre.matieres]
        };
        this.evenements.push(evenement);
        this.showCreateEvenementModal = false;
        this.ouvrirAttribuerTrimestre(evenement);
    }

    // ═══════════════ ATTRIBUTION NOTES SIMPLES ═══════════════
    ouvrirAttribuerNotes(type: string, titre: string, _evenementId?: number): void {
        this.showAttribuerNotesModal = { type, titre };
        const eleves = this.schoolData.elevesPourClasse(this.selectedClasse!);
        this.formAttribuer = eleves.map(e => ({ eleveId: e.id, note: 0 }));
    }

    enregistrerAttribution(): void {
        if (!this.showAttribuerNotesModal) return;
        const { type, titre } = this.showAttribuerNotesModal;
        const matiere = this.formDevoir.matiere;
        this.formAttribuer.forEach(att => {
            if (att.note < 0) return;
            const note: NoteEntry = {
                id: Date.now() + Math.random(),
                eleveId: att.eleveId,
                matiere: matiere || '',
                type: type as NoteEntry['type'],
                titre,
                note: att.note,
                date: new Date().toISOString().split('T')[0]
            };
            const notesEleve = this.notesStore.get(att.eleveId) || [];
            notesEleve.push(note);
            this.notesStore.set(att.eleveId, notesEleve);
        });
        this.showAttribuerNotesModal = null;
    }

    // ═══════════════ ATTRIBUTION NOTES TRIMESTRE ═══════════════
    ouvrirAttribuerTrimestre(evenement: EvenementCollectif): void {
        if (!this.selectedClasse) return;
        const eleves = this.schoolData.elevesPourClasse(this.selectedClasse);
        if (eleves.length === 0) return;
        this.currentTrimestreState = {
            opened: true,
            trimestreId: evenement.id,
            eleveIndex: 0,
            eleves: eleves
        };
        this.preparerFormulaireTrimestre(evenement);
        this.showAttribuerTrimestreModal = true;
    }

    currentTrimestreState: AttributionTrimestreState | null = null;

    private preparerFormulaireTrimestre(evenement: EvenementCollectif): void {
        this.formAttribuerTrimestre = evenement.matieres.map(matiere => ({
            matiere,
            moyenneClasse: 0,
            noteCompo: 0,
            moyenne: 0,
            coefficient: 1,
            moyenneCoefficientee: 0,
            appreciation: ''
        }));
    }

    siguienteEleveTrimestre(): void {
        if (!this.currentTrimestreState) return;
        this.enregistrerNotesTrimestreEleve();
        this.currentTrimestreState.eleveIndex++;
        if (this.currentTrimestreState.eleveIndex >= this.currentTrimestreState.eleves.length) {
            this.fermerAttribuerTrimestreModal();
            return;
        }
        const trimestre = this.evenements.find(e => e.id === this.currentTrimestreState!.trimestreId);
        if (trimestre) this.preparerFormulaireTrimestre(trimestre);
    }

    private enregistrerNotesTrimestreEleve(): void {
        if (!this.currentTrimestreState) return;
        const eleve = this.currentTrimestreState.eleves[this.currentTrimestreState.eleveIndex];
        if (!eleve) return;
        let notesTrimestre = this.notesTrimestreStore.get(eleve.id) || [];
        this.formAttribuerTrimestre.forEach(ligne => {
            notesTrimestre.push({
                id: Date.now() + Math.random(),
                eleveId: eleve.id,
                trimestreId: this.currentTrimestreState!.trimestreId,
                matiere: ligne.matiere,
                moyenneClasse: ligne.moyenneClasse,
                noteCompo: ligne.noteCompo,
                moyenne: ligne.moyenne,
                coefficient: ligne.coefficient,
                moyenneCoefficientee: ligne.moyenneCoefficientee,
                appreciation: ligne.appreciation,
                date: new Date().toISOString().split('T')[0]
            });
        });
        this.notesTrimestreStore.set(eleve.id, notesTrimestre);
    }

    fermerAttribuerTrimestreModal(): void {
        this.showAttribuerTrimestreModal = false;
        this.currentTrimestreState = null;
        this.formAttribuerTrimestre = [];
    }

    calculerMoyenneCoefficientee(index: number): void {
        const ligne = this.formAttribuerTrimestre[index];
        ligne.moyenneCoefficientee = ligne.moyenne * ligne.coefficient;
    }

    // ═══════════════ RETOUR ═══════════════
    retourAccueil(): void {
        this.mode = 'home';
        this.selectedClasse = null;
        this.selectedAnnee = null;
        this.showVoirModal = false;
        this.showElevesModal = null;
        this.selectedEleve = null;
        this.showGererClasseModal = null;
    }
}