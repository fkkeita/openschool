import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { SchoolDataService, Cycle, Annee, Eleve } from '../../core/services/school-data.service';

// ─── Types locaux inchangés ─────────────────────────────────
interface FormEleve {
    prenom: string;
    nom: string;
    dateNaiss: string;
    lieuNaiss: string;
    sexe: 'M' | 'F';
    nationalite: string;
    tuteurNom: string;
    tuteurPrenom: string;
    tuteurTel: string;
    tuteurEmail: string;
    tuteurAdresse: string;
    classe: string;
    dateInscription: string;
    matricule: string;
    fraisInscription: number;
    mensualite: number;
    modePaiement: string;
    echeances: string;
    totalAnnuel: string;
    resteAPayer: string;
    statutPaiement: string;
}

interface ModalAnnee {
    annee: string;
    classes: { nom: string; eleves: Eleve[]; }[];
}

interface ModalClasse {
    classe: string;
    eleves: Eleve[];
}

@Component({
    selector: 'app-students',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './students.component.html',
    styleUrl: './students.component.scss'
})
export class StudentsComponent implements OnInit {

    private schoolData = inject(SchoolDataService);

    cycles: Cycle[] = this.schoolData.cycles;

    classesListe: string[] = [];

    cycleOuvert: Record<string, boolean> = {};
    vue: 'accueil' | 'gestion' = 'accueil';
    filtreAnneeCourante: string | null = null;
    ajoutGlobal = false;
    classeActive: string | null = null;

    rechercheAccueil = '';
    rechercheClasse = '';
    rechercheEleve = '';

    afficherModalEleve = false;
    afficherModalAnnee = false;
    afficherModalClasse = false;

    modalAnnee?: ModalAnnee;
    modalClasse?: ModalClasse;

    elevesOuverts = new Set<number>();

    etapeCourante = 1;
    modeEdition = false;
    eleveEditeId: number | null = null;

    formData: FormEleve = this.creerFormulaireVide();

    // ═══════════════ INITIALISATION ═══════════════
    ngOnInit(): void {
        this.classesListe = this.schoolData.toutesLesClasses();
        this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);
    }

    // ═══════════════ HELPERS ═══════════════
    private creerFormulaireVide(): FormEleve {
        return {
            prenom: '', nom: '', dateNaiss: '', lieuNaiss: '', sexe: 'M', nationalite: 'Malienne',
            tuteurNom: '', tuteurPrenom: '', tuteurTel: '', tuteurEmail: '', tuteurAdresse: '',
            classe: '', dateInscription: '', matricule: 'AUTO' + Math.floor(Math.random() * 10000),
            fraisInscription: 250, mensualite: 120, modePaiement: 'especes', echeances: '',
            totalAnnuel: '', resteAPayer: '0 €', statutPaiement: 'À jour'
        };
    }

    recupererClassesParAnnee(anneeNom: string): string[] {
        return this.schoolData.classesPourAnnee(anneeNom);
    }

    calculerStatsAnnee(anneeNom: string): { totalEleves: number; presence: string; nbClasses: number } {
        const classes = this.recupererClassesParAnnee(anneeNom);
        let total = 0;
        let presents = 0;
        classes.forEach(classe => {
            const eleves = this.schoolData.elevesPourClasse(classe);
            total += eleves.length;
            presents += eleves.filter(e => e.presence === 'Présent').length;
        });
        const presence = total > 0 ? `${Math.round((presents / total) * 100)}%` : '0%';
        return { totalEleves: total, presence, nbClasses: classes.length };
    }

    effectifClasse(classe: string): number {
        return this.schoolData.elevesPourClasse(classe).length;
    }

    anneesVisibles(cycle: Cycle): Annee[] {
        if (!this.rechercheAccueil) return cycle.annees;
        const terme = this.rechercheAccueil.toLowerCase();
        return cycle.annees.filter(a =>
            a.nom.toLowerCase().includes(terme) || a.description.toLowerCase().includes(terme)
        );
    }

    basculerCycle(cycleNom: string): void {
        const dejaOuvert = this.cycleOuvert[cycleNom];
        this.cycles.forEach(c => this.cycleOuvert[c.nom] = false);
        this.cycleOuvert[cycleNom] = !dejaOuvert;
    }

    onRechercheAccueilChange(valeur: string): void {
        this.rechercheAccueil = valeur;
        if (valeur) {
            this.cycles.forEach(c => this.cycleOuvert[c.nom] = true);
        } else {
            this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);
        }
    }

    ouvrirGestion(anneeNom: string): void {
        this.vue = 'gestion';
        this.filtreAnneeCourante = anneeNom;
        this.classeActive = null;
        this.rechercheClasse = '';
        this.rechercheEleve = '';
    }

    get classesDisponiblesForm(): string[] {
        if (this.ajoutGlobal || !this.filtreAnneeCourante) {
            return this.classesListe;
        }
        return this.recupererClassesParAnnee(this.filtreAnneeCourante);
    }

    ouvrirModalAnnee(anneeNom: string): void {
        const classes = this.recupererClassesParAnnee(anneeNom).map(classe => ({
            nom: classe,
            eleves: this.schoolData.elevesPourClasse(classe)
        }));
        this.modalAnnee = { annee: anneeNom, classes };
        this.afficherModalAnnee = true;
    }

    ouvrirModalClasse(classe: string): void {
        this.modalClasse = {
            classe,
            eleves: this.schoolData.elevesPourClasse(classe)
        };
        this.afficherModalClasse = true;
    }

    // ─── Classes filtrées pour la vue gestion ───
    get classesFiltrees(): string[] {
        let base = [...this.classesListe];
        if (this.filtreAnneeCourante) {
            const classesAnnee = this.recupererClassesParAnnee(this.filtreAnneeCourante);
            base = base.filter(c => classesAnnee.includes(c));
        }
        if (this.rechercheClasse) {
            const terme = this.rechercheClasse.toLowerCase();
            base = base.filter(c => c.toLowerCase().includes(terme));
        }
        return base;
    }

    selectionnerClasse(classe: string): void {
        this.classeActive = classe;
    }

    get elevesFiltres(): Eleve[] {
        if (!this.classeActive) return [];
        const eleves = this.schoolData.elevesPourClasse(this.classeActive);
        if (!this.rechercheEleve) return eleves;
        const terme = this.rechercheEleve.toLowerCase();
        return eleves.filter(e => e.fullName?.toLowerCase().includes(terme));
    }

    // ─── Gestion des modales d'ajout / édition ───
    ouvrirModalAjout(global = false): void {
        if (!global && !this.classeActive) {
            alert('Sélectionnez d\'abord une classe à gauche.');
            return;
        }
        this.ajoutGlobal = global;
        this.modeEdition = false;
        this.eleveEditeId = null;
        this.formData = this.creerFormulaireVide();
        if (!global && this.classeActive) {
            this.formData.classe = this.classeActive;
        }
        this.etapeCourante = 1;
        this.afficherModalEleve = true;
    }

    ouvrirModalEdition(eleve: Eleve, classe: string): void {
        this.modeEdition = true;
        this.eleveEditeId = eleve.id;
        this.formData = {
            ...this.creerFormulaireVide(),
            prenom: eleve.prenom,
            nom: eleve.nom,
            tuteurPrenom: eleve.parent?.split(' ')[0] || '',
            tuteurNom: eleve.parent?.split(' ')[1] || '',
            tuteurTel: eleve.telephone || '',
            tuteurEmail: eleve.email || '',
            classe,
        };
        this.etapeCourante = 1;
        this.afficherModalEleve = true;
    }

    allerEtape(etape: number): void {
        this.etapeCourante = etape;
        if (etape === 5) {
            const frais = Number(this.formData.fraisInscription) || 0;
            const mens = Number(this.formData.mensualite) || 0;
            this.formData.totalAnnuel = (frais + mens * 12).toFixed(2) + ' €';
        }
    }

    enregistrerEleve(): void {
        if (!this.formData.prenom || !this.formData.nom || !this.formData.classe) {
            alert('Prénom, Nom et Classe sont obligatoires.');
            return;
        }

        const nouvelEleve: Eleve = {
            id: this.modeEdition && this.eleveEditeId ? this.eleveEditeId : 0,
            prenom: this.formData.prenom,
            nom: this.formData.nom,
            fullName: `${this.formData.prenom} ${this.formData.nom}`,
            classe: this.formData.classe,
            notes: { maths: '00.0', francais: '00.0', anglais: '00.0' },
            presence: 'Présent',
            email: this.formData.tuteurEmail || `${this.formData.prenom.toLowerCase()}.${this.formData.nom.toLowerCase()}@ecole.ml`,
            telephone: this.formData.tuteurTel || '+223 00000000',
            parent: `${this.formData.tuteurPrenom} ${this.formData.tuteurNom}`.trim() || 'Parent'
        };

        if (this.modeEdition && this.eleveEditeId) {
            this.schoolData.modifierEleve(nouvelEleve);
        } else {
            this.schoolData.ajouterEleve(nouvelEleve);
        }

        this.afficherModalEleve = false;
    }

    supprimerEleve(id: number): void {
        if (!this.classeActive) return;
        const confirmation = confirm('Supprimer cet élève ?');
        if (!confirmation) return;
        this.schoolData.supprimerEleve(id);
        this.elevesOuverts.delete(id);
    }

    voirNotes(eleve: Eleve): void {
        alert(`Notes de ${eleve.prenom} ${eleve.nom}\nMaths: ${eleve.notes?.maths}\nFrançais: ${eleve.notes?.francais}\nAnglais: ${eleve.notes?.anglais}`);
    }

    revenirAccueil(): void {
        this.vue = 'accueil';
        this.filtreAnneeCourante = null;
        this.classeActive = null;
    }

    infoFiltreAvance(): void {
        alert('Fonctionnalité de filtre avancé - à implémenter avec un backend.');
    }

    imprimer(): void {
        window.print();
    }

    fermerToutesModales(): void {
        this.afficherModalAnnee = false;
        this.afficherModalClasse = false;
    }

    trackByEleveId(_: number, eleve: Eleve): number {
        return eleve.id;
    }

    estEleveOuvert(id: number): boolean {
        return this.elevesOuverts.has(id);
    }

    basculerEleve(id: number): void {
        if (this.elevesOuverts.has(id)) {
            this.elevesOuverts.delete(id);
        } else {
            this.elevesOuverts.add(id);
        }
    }
}