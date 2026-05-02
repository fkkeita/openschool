import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { SchoolDataService, Cycle, Annee } from '../../core/services/school-data.service';

// ─── Interfaces locales ────────────────────────────────────────
interface Materiel {
  nom: string;
  quantite: number;
}

interface Eleve {
  id: number;
  prenom: string;
  nom: string;
}

interface ClasseEtendue {
  nom: string;             // ex: "1ère Année D"
  annee: string;           // ex: "1ère Année"
  capaciteMax: number;
  materiels: Materiel[];
  eleves: Eleve[];
}

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss'
})
export class ClassesComponent implements OnInit {

  private schoolData = inject(SchoolDataService);

  // ── Accueil ───────────────────────────────────────────────
  public rechercheAccueil = '';
  public cycleOuvert: Record<string, boolean> = {};

  // ── État de la vue ────────────────────────────────────────
  public vue: 'accueil' | 'gestion' = 'accueil';
  public selectedAnnee: Annee | null = null;

  // ── Données des classes étendues ─────────────────────────
  public classesMap: Map<string, ClasseEtendue> = new Map();

  public get classesListe(): ClasseEtendue[] {
    return Array.from(this.classesMap.values()).sort((a, b) => a.nom.localeCompare(b.nom));
  }

  // ── Modales ───────────────────────────────────────────────
  public showModalAjoutClasse = false;
  public showModalModifierClasse: ClasseEtendue | null = null;
  public showModalDetailClasse: ClasseEtendue | null = null;
  public showModalEleves: ClasseEtendue | null = null;
  public showModalTransfert: { classeSource: ClasseEtendue } | null = null;

  // Formulaire (création & modification)
  public formClasse = {
    anneeNom: '',
    capaciteMax: 30,
    materielsList: [
      { nom: 'Tables', quantite: 20, selected: true },
      { nom: 'Chaises', quantite: 20, selected: true },
      { nom: 'Tableau', quantite: 1, selected: true },
      { nom: 'Craies / Marqueurs', quantite: 20, selected: false },
      { nom: 'Livres', quantite: 0, selected: false },
      { nom: 'Règles', quantite: 0, selected: false },
      { nom: 'Compas', quantite: 0, selected: false },
      { nom: 'Cartes géographiques', quantite: 0, selected: false },
      { nom: 'Ordinateur', quantite: 0, selected: false },
      { nom: 'Projecteur', quantite: 0, selected: false },
      { nom: 'Ventilateur', quantite: 0, selected: false },
      { nom: 'Poubelle', quantite: 1, selected: true },
      { nom: 'Armoire', quantite: 0, selected: false },
      { nom: 'Bureau du professeur', quantite: 1, selected: true },
      { nom: 'Étagère', quantite: 0, selected: false },
      { nom: 'Tableau d\'affichage', quantite: 1, selected: false },
      { nom: 'Horloge', quantite: 1, selected: true },
      { nom: 'Rideaux', quantite: 0, selected: false }
    ]
  };

  // Ajout élève
  public showModalAjoutEleve: { classe: ClasseEtendue } | null = null;
  public formEleve = { prenom: '', nom: '' };

  // Transfert
  public classeTransfertDestination: string = '';
  public elevesSelectionnes: Set<number> = new Set();

  get cycles(): Cycle[] { return this.schoolData.cycles; }

  // ═══════════════════════════════════════════════════════════
  ngOnInit(): void {
    this.cycles.forEach((c, i) => this.cycleOuvert[c.nom] = i === 0);
    this.initialiserClasses();
  }

  private initialiserClasses(): void {
    this.cycles.forEach(cycle => {
      cycle.annees.forEach(annee => {
        const noms = this.schoolData.classesPourAnnee(annee.nom);
        noms.forEach(nom => {
          if (!this.classesMap.has(nom)) {
            this.classesMap.set(nom, {
              nom,
              annee: annee.nom,
              capaciteMax: 35,
              materiels: [
                { nom: 'Tables', quantite: 20 },
                { nom: 'Chaises', quantite: 20 },
                { nom: 'Tableau', quantite: 1 },
                { nom: 'Poubelle', quantite: 1 }
              ],
              eleves: this.genererElevesFictifs(nom)
            });
          }
        });
      });
    });
  }

  private genererElevesFictifs(classe: string): Eleve[] {
    const nb = Math.floor(Math.random() * 25) + 5;
    const eleves: Eleve[] = [];
    for (let i = 1; i <= nb; i++) {
      eleves.push({ id: Date.now() + i, prenom: `Élève${i}`, nom: classe });
    }
    return eleves;
  }

  // ═══════════════════════════════════════════════════════════
  // ACCUEIL
  // ═══════════════════════════════════════════════════════════
  basculerCycle(nom: string): void { this.cycleOuvert[nom] = !this.cycleOuvert[nom]; }

  anneesVisibles(cycle: Cycle): Annee[] {
    if (!this.rechercheAccueil) return cycle.annees;
    const t = this.rechercheAccueil.toLowerCase();
    return cycle.annees.filter(a => a.nom.toLowerCase().includes(t) || a.description.toLowerCase().includes(t));
  }

  statsPourAnnee(anneeNom: string): { nbClasses: number; nbEleves: number; capaciteTotale: number } {
    const classes = this.classesListe.filter(c => c.annee === anneeNom);
    return {
      nbClasses: classes.length,
      nbEleves: classes.reduce((sum, c) => sum + c.eleves.length, 0),
      capaciteTotale: classes.reduce((sum, c) => sum + c.capaciteMax, 0)
    };
  }

  classesDeLAnnee(anneeNom: string): ClasseEtendue[] {
    return this.classesListe.filter(c => c.annee === anneeNom);
  }

  ouvrirGestion(annee: Annee): void {
    this.selectedAnnee = annee;
    this.vue = 'gestion';
  }

  revenirAccueil(): void {
    this.vue = 'accueil';
    this.selectedAnnee = null;
  }

  // ═══════════════════════════════════════════════════════════
  // CRÉATION & MODIFICATION
  // ═══════════════════════════════════════════════════════════
  ouvrirModalAjoutClasse(): void {
    if (!this.selectedAnnee) return;
    this.formClasse.anneeNom = this.selectedAnnee.nom;
    this.formClasse.capaciteMax = 30;
    this.formClasse.materielsList.forEach(m => { m.quantite = 0; m.selected = false; });
    // Pré-sélections par défaut
    const defauts = ['Tables', 'Chaises', 'Tableau', 'Poubelle', 'Bureau du professeur', 'Horloge'];
    this.formClasse.materielsList.forEach(m => {
      if (defauts.includes(m.nom)) { m.selected = true; m.quantite = m.nom === 'Tableau' ? 1 : m.nom === 'Poubelle' ? 1 : m.nom === 'Bureau du professeur' ? 1 : m.nom === 'Horloge' ? 1 : 20; }
    });
    this.showModalAjoutClasse = true;
  }

  /** Ouvre la modification (pré-remplit avec les valeurs existantes) */
  ouvrirModalModification(classe: ClasseEtendue): void {
    this.formClasse.anneeNom = classe.annee;
    this.formClasse.capaciteMax = classe.capaciteMax;
    // Réinitialiser les sélections
    this.formClasse.materielsList.forEach(mat => { mat.selected = false; mat.quantite = 0; });
    classe.materiels.forEach(existing => {
      const found = this.formClasse.materielsList.find(m => m.nom === existing.nom);
      if (found) {
        found.selected = true;
        found.quantite = existing.quantite;
      }
    });
    this.showModalModifierClasse = classe;
  }

  getProchaineLettre(anneeNom: string): string {
    const classesExistantes = this.classesDeLAnnee(anneeNom);
    const lettresUtilisees = classesExistantes.map(c => c.nom.split(' ').pop() || '');
    for (let code = 65; code <= 90; code++) {
      const lettre = String.fromCharCode(code);
      if (!lettresUtilisees.includes(lettre)) return lettre;
    }
    return 'Z';
  }

  creerClasse(): void {
    if (!this.formClasse.anneeNom) return;
    const lettre = this.getProchaineLettre(this.formClasse.anneeNom);
    const nomClasse = `${this.formClasse.anneeNom} ${lettre}`;
    const materiels: Materiel[] = this.formClasse.materielsList
      .filter(m => m.selected)
      .map(m => ({ nom: m.nom, quantite: m.quantite || 0 }));
    const nouvelleClasse: ClasseEtendue = {
      nom: nomClasse,
      annee: this.formClasse.anneeNom,
      capaciteMax: this.formClasse.capaciteMax,
      materiels,
      eleves: []
    };
    this.classesMap.set(nomClasse, nouvelleClasse);
    this.showModalAjoutClasse = false;
  }

  sauvegarderModification(): void {
    if (!this.showModalModifierClasse) return;
    const classe = this.showModalModifierClasse;
    classe.capaciteMax = this.formClasse.capaciteMax;
    classe.materiels = this.formClasse.materielsList
      .filter(m => m.selected)
      .map(m => ({ nom: m.nom, quantite: m.quantite || 0 }));
    this.showModalModifierClasse = null;
  }

  // ═══════════════════════════════════════════════════════════
  // DÉTAIL CLASSE (depuis accueil ou gestion)
  // ═══════════════════════════════════════════════════════════
  ouvrirDetailClasse(classe: ClasseEtendue): void {
    this.showModalDetailClasse = classe;
  }

  // ═══════════════════════════════════════════════════════════
  // GESTION ÉLÈVES
  // ═══════════════════════════════════════════════════════════
  ouvrirModalEleves(classe: ClasseEtendue): void { this.showModalEleves = classe; }

  ouvrirAjoutEleve(classe: ClasseEtendue): void {
    this.formEleve = { prenom: '', nom: '' };
    this.showModalAjoutEleve = { classe };
  }

  ajouterEleve(): void {
    if (!this.showModalAjoutEleve || !this.formEleve.prenom) return;
    const nouvelEleve: Eleve = {
      id: Date.now(),
      prenom: this.formEleve.prenom,
      nom: this.formEleve.nom
    };
    this.showModalAjoutEleve.classe.eleves.push(nouvelEleve);
    this.showModalAjoutEleve = null;
  }

  ouvrirModalTransfert(classeSource: ClasseEtendue): void {
    this.elevesSelectionnes.clear();
    this.classeTransfertDestination = '';
    this.showModalTransfert = { classeSource };
  }

  getClassesTransfertPossibles(): ClasseEtendue[] {
    if (!this.showModalTransfert) return [];
    return this.classesDeLAnnee(this.showModalTransfert.classeSource.annee)
      .filter(c => c.nom !== this.showModalTransfert!.classeSource.nom);
  }

  toggleSelectionEleve(id: number): void {
    if (this.elevesSelectionnes.has(id)) this.elevesSelectionnes.delete(id);
    else this.elevesSelectionnes.add(id);
  }

  transfererEleves(): void {
    if (!this.showModalTransfert || !this.classeTransfertDestination) return;
    const source = this.showModalTransfert.classeSource;
    const destination = this.classesMap.get(this.classeTransfertDestination);
    if (!destination) return;
    const elevesAtransferer = source.eleves.filter(e => this.elevesSelectionnes.has(e.id));
    source.eleves = source.eleves.filter(e => !this.elevesSelectionnes.has(e.id));
    destination.eleves.push(...elevesAtransferer);
    this.showModalTransfert = null;
    this.elevesSelectionnes.clear();
  }

  supprimerClasse(classe: ClasseEtendue): void {
    if (classe.eleves.length > 0) {
      alert('Veuillez d\'abord transférer ou supprimer tous les élèves de cette classe.');
      return;
    }
    if (confirm(`Supprimer définitivement la classe ${classe.nom} ?`)) {
      this.classesMap.delete(classe.nom);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════════════════════
  tauxRemplissage(classe: ClasseEtendue): number {
    if (classe.capaciteMax === 0) return 0;
    return Math.round((classe.eleves.length / classe.capaciteMax) * 100);
  }

  couleurRemplissage(taux: number): string {
    if (taux >= 90) return '#ef4444';
    if (taux >= 70) return '#f59e0b';
    return '#10b981';
  }
}