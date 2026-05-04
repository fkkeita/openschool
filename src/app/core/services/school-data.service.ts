import { Injectable } from '@angular/core';

// ─── INTERFACES ──────────────────────────────────────────────────
export interface Cycle { nom: string; description: string; icon: string; annees: Annee[]; }
export interface Annee { nom: string; badge: string; nbClasses: number; description: string; filieres?: string[]; }
export interface Affectation { classe: string; matiere: string; }

export interface Enseignant {
    id: number; prenom: string; nom: string; fullName?: string;
    email: string; telephone: string; matierePrincipale: string;
    grade: string; dateEmbauche: string; hourlyRate?: number;
    affectations: Affectation[];
}

export interface Matiere {
    id: number; nom: string; code: string; coefficient: number;
    cycle: string; annees: string[]; couleur?: string;
    description?: string; programme?: string;
}

export interface LogbookEntry {
    id: string; date: string; slot: string; teacherId: number;
    subject: string; classe: string; lessonTitle: string;
    signed: boolean; valide: boolean;
}

export interface SlotConfig {
    id: string;
    startTime: string;
    endTime: string;
    isPause: boolean;
    name?: string;
}

// ═══════════════════ INTERFACE ÉLÈVE (CENTRALISÉE) ═══════════════
export interface Eleve {
    id: number;
    prenom: string;
    nom: string;
    classe: string;
    // Champs supplémentaires pour le composant Élèves (optionnels)
    fullName?: string;
    notes?: { maths: string; francais: string; anglais: string; };
    presence?: 'Présent' | 'Absent';
    email?: string;
    telephone?: string;
    parent?: string;
}

// ─── SERVICE ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SchoolDataService {

    /** Structure des cycles (partagée avec tous les composants) */
    public cycles: Cycle[] = [
        {
            nom: '1er CYCLE', icon: 'book-open',
            description: '6 années - Cycle Fondamental (1ère à 6ème)',
            annees: [
                { nom: '1ère Année', badge: 'Fondamental', nbClasses: 3, description: 'Première année du cycle fondamental.' },
                { nom: '2ème Année', badge: 'Fondamental', nbClasses: 3, description: 'Consolidation des acquis de base.' },
                { nom: '3ème Année', badge: 'Fondamental', nbClasses: 2, description: 'Approfondissement des connaissances.' },
                { nom: '4ème Année', badge: 'Fondamental', nbClasses: 2, description: 'Introduction aux sciences naturelles.' },
                { nom: '5ème Année', badge: 'Fondamental', nbClasses: 3, description: 'Préparation au cycle supérieur.' },
                { nom: '6ème Année', badge: 'Fondamental', nbClasses: 3, description: 'Fin du cycle fondamental.' }
            ]
        },
        {
            nom: '2ème CYCLE', icon: 'graduation-cap',
            description: "3 années - Cycle d'orientation (7ème à 9ème)",
            annees: [
                { nom: '7ème Année', badge: 'Orientation', nbClasses: 3, description: "Début du cycle d'orientation." },
                { nom: '8ème Année', badge: 'Orientation', nbClasses: 3, description: 'Orientation progressive.' },
                { nom: '9ème Année', badge: 'Orientation', nbClasses: 3, description: 'Préparation au lycée.' }
            ]
        },
        {
            nom: 'LYCÉE', icon: 'school',
            description: '3 années - Lycée (Seconde, Première, Terminale)',
            annees: [
                { nom: '10ème (Seconde)', badge: 'Lycée', nbClasses: 3, filieres: ['S', 'L', 'ES'], description: 'Tronc commun — toutes filières.' },
                { nom: '11ème (Première)', badge: 'Lycée', nbClasses: 3, filieres: ['S', 'L', 'ES'], description: 'Filières : Scientifique, Littéraire, Économique.' },
                { nom: '12ème (Terminale)', badge: 'Lycée', nbClasses: 3, filieres: ['S', 'L', 'ES'], description: 'Année du baccalauréat.' }
            ]
        }
    ];

    /**
     * ENSEIGNANTS — chacun est lié à ses classes ET matières réelles.
     * Un enseignant peut enseigner la même matière dans plusieurs classes.
     */
    public enseignants: Enseignant[] = [
        // ── 1er CYCLE ──────────────────────────────────────────
        {
            id: 1, prenom: 'Moussa', nom: 'Traoré', email: 'moussa.traore@elfarouk.ml',
            telephone: '+223 76 11 22 33', matierePrincipale: 'Mathématiques',
            grade: 'Titulaire', dateEmbauche: '2012-09-01', hourlyRate: 2500,
            fullName: 'Moussa Traoré',
            affectations: [
                { classe: '1ère Année A', matiere: 'Mathématiques' },
                { classe: '1ère Année B', matiere: 'Mathématiques' },
                { classe: '1ère Année C', matiere: 'Mathématiques' }
            ]
        },
        {
            id: 2, prenom: 'Fatoumata', nom: 'Keïta', email: 'fatoumata.keita@elfarouk.ml',
            telephone: '+223 66 22 33 44', matierePrincipale: 'Français',
            grade: 'Titulaire', dateEmbauche: '2014-10-01', hourlyRate: 2500,
            fullName: 'Fatoumata Keïta',
            affectations: [
                { classe: '1ère Année A', matiere: 'Français' },
                { classe: '1ère Année B', matiere: 'Français' },
                { classe: '1ère Année C', matiere: 'Français' }
            ]
        },
        {
            id: 3, prenom: 'Ibrahim', nom: 'Coulibaly', email: 'ibrahim.coulibaly@elfarouk.ml',
            telephone: '+223 79 33 44 55', matierePrincipale: 'Sciences',
            grade: 'Certifié', dateEmbauche: '2016-09-01', hourlyRate: 2000,
            fullName: 'Ibrahim Coulibaly',
            affectations: [
                { classe: '1ère Année A', matiere: 'Sciences Naturelles' },
                { classe: '1ère Année B', matiere: 'Sciences Naturelles' },
                { classe: '2ème Année A', matiere: 'Sciences Naturelles' }
            ]
        },
        {
            id: 4, prenom: 'Aminata', nom: 'Diallo', email: 'aminata.diallo@elfarouk.ml',
            telephone: '+223 65 44 55 66', matierePrincipale: 'Histoire-Géographie',
            grade: 'Contractuel', dateEmbauche: '2019-09-01', hourlyRate: 1800,
            fullName: 'Aminata Diallo',
            affectations: [
                { classe: '1ère Année A', matiere: 'Histoire-Géographie' },
                { classe: '2ème Année A', matiere: 'Histoire-Géographie' },
                { classe: '2ème Année B', matiere: 'Histoire-Géographie' }
            ]
        },
        {
            id: 5, prenom: 'Boubacar', nom: 'Sissoko', email: 'boubacar.sissoko@elfarouk.ml',
            telephone: '+223 76 55 66 77', matierePrincipale: 'Anglais',
            grade: 'Titulaire', dateEmbauche: '2011-09-01', hourlyRate: 2500,
            fullName: 'Boubacar Sissoko',
            affectations: [
                { classe: '1ère Année B', matiere: 'Anglais' },
                { classe: '1ère Année C', matiere: 'Anglais' },
                { classe: '2ème Année A', matiere: 'Anglais' }
            ]
        },
        {
            id: 6, prenom: 'Mariam', nom: 'Touré', email: 'mariam.toure@elfarouk.ml',
            telephone: '+223 67 66 77 88', matierePrincipale: 'Mathématiques',
            grade: 'Certifié', dateEmbauche: '2017-09-01', hourlyRate: 2000,
            fullName: 'Mariam Touré',
            affectations: [
                { classe: '2ème Année A', matiere: 'Mathématiques' },
                { classe: '2ème Année B', matiere: 'Mathématiques' },
                { classe: '2ème Année C', matiere: 'Mathématiques' }
            ]
        },
        {
            id: 7, prenom: 'Drissa', nom: 'Camara', email: 'drissa.camara@elfarouk.ml',
            telephone: '+223 76 77 88 99', matierePrincipale: 'EPS',
            grade: 'Contractuel', dateEmbauche: '2020-09-01', hourlyRate: 1500,
            fullName: 'Drissa Camara',
            affectations: [
                { classe: '1ère Année A', matiere: 'EPS' },
                { classe: '1ère Année B', matiere: 'EPS' },
                { classe: '1ère Année C', matiere: 'EPS' },
                { classe: '2ème Année A', matiere: 'EPS' }
            ]
        },
        // ── 2ème CYCLE ─────────────────────────────────────────
        {
            id: 8, prenom: 'Souleymane', nom: 'Konaté', email: 'souleymane.konate@elfarouk.ml',
            telephone: '+223 65 88 99 00', matierePrincipale: 'Mathématiques',
            grade: 'Agrégé', dateEmbauche: '2008-09-01', hourlyRate: 3000,
            fullName: 'Souleymane Konaté',
            affectations: [
                { classe: '7ème Année A', matiere: 'Mathématiques' },
                { classe: '7ème Année B', matiere: 'Mathématiques' },
                { classe: '7ème Année C', matiere: 'Mathématiques' }
            ]
        },
        {
            id: 9, prenom: 'Kadiatou', nom: 'Dembélé', email: 'kadia.dembele@elfarouk.ml',
            telephone: '+223 76 99 00 11', matierePrincipale: 'Français',
            grade: 'Titulaire', dateEmbauche: '2013-09-01', hourlyRate: 2500,
            fullName: 'Kadiatou Dembélé',
            affectations: [
                { classe: '7ème Année A', matiere: 'Français' },
                { classe: '7ème Année B', matiere: 'Français' },
                { classe: '8ème Année A', matiere: 'Français' }
            ]
        },
        {
            id: 10, prenom: 'Oumar', nom: 'Diakité', email: 'oumar.diakite@elfarouk.ml',
            telephone: '+223 66 00 11 22', matierePrincipale: 'Physique-Chimie',
            grade: 'Certifié', dateEmbauche: '2015-09-01', hourlyRate: 2200,
            fullName: 'Oumar Diakité',
            affectations: [
                { classe: '7ème Année A', matiere: 'Physique-Chimie' },
                { classe: '7ème Année C', matiere: 'Physique-Chimie' },
                { classe: '8ème Année B', matiere: 'Physique-Chimie' }
            ]
        },
        {
            id: 11, prenom: 'Hawa', nom: 'Sangaré', email: 'hawa.sangare@elfarouk.ml',
            telephone: '+223 79 11 22 33', matierePrincipale: 'SVT',
            grade: 'Titulaire', dateEmbauche: '2014-09-01', hourlyRate: 2200,
            fullName: 'Hawa Sangaré',
            affectations: [
                { classe: '7ème Année B', matiere: 'SVT' },
                { classe: '8ème Année A', matiere: 'SVT' },
                { classe: '8ème Année C', matiere: 'SVT' }
            ]
        },
        {
            id: 12, prenom: 'Adama', nom: 'Fofana', email: 'adama.fofana@elfarouk.ml',
            telephone: '+223 65 22 33 44', matierePrincipale: 'Anglais',
            grade: 'Contractuel', dateEmbauche: '2018-09-01', hourlyRate: 1800,
            fullName: 'Adama Fofana',
            affectations: [
                { classe: '7ème Année A', matiere: 'Anglais' },
                { classe: '8ème Année A', matiere: 'Anglais' },
                { classe: '9ème Année A', matiere: 'Anglais' }
            ]
        },
        // ── 1er CYCLE (3ème – 6ème années) — complétion ─────────
        {
            id: 18, prenom: 'Binta', nom: 'Koné', fullName: 'Binta Koné', email: 'binta.kone@elfarouk.ml', telephone: '+223 76 44 55 66', matierePrincipale: 'Mathématiques', grade: 'Certifié', dateEmbauche: '2016-09-01', hourlyRate: 2000,
            affectations: [{ classe: '3ème Année A', matiere: 'Mathématiques' }, { classe: '3ème Année B', matiere: 'Mathématiques' }, { classe: '4ème Année A', matiere: 'Mathématiques' }, { classe: '4ème Année B', matiere: 'Mathématiques' }]
        },
        {
            id: 19, prenom: 'Lassine', nom: 'Traoré', fullName: 'Lassine Traoré', email: 'lassine.traore@elfarouk.ml', telephone: '+223 65 55 66 77', matierePrincipale: 'Français', grade: 'Titulaire', dateEmbauche: '2013-09-01', hourlyRate: 2200,
            affectations: [{ classe: '3ème Année A', matiere: 'Français' }, { classe: '3ème Année B', matiere: 'Français' }, { classe: '4ème Année A', matiere: 'Français' }, { classe: '4ème Année B', matiere: 'Français' }]
        },
        {
            id: 20, prenom: 'Kanta', nom: 'Sanogo', fullName: 'Kanta Sanogo', email: 'kanta.sanogo@elfarouk.ml', telephone: '+223 79 66 77 88', matierePrincipale: 'Sciences Naturelles', grade: 'Contractuel', dateEmbauche: '2019-09-01', hourlyRate: 1800,
            affectations: [{ classe: '3ème Année A', matiere: 'Sciences Naturelles' }, { classe: '3ème Année B', matiere: 'Sciences Naturelles' }, { classe: '4ème Année A', matiere: 'Sciences Naturelles' }, { classe: '4ème Année B', matiere: 'Sciences Naturelles' }]
        },
        {
            id: 21, prenom: 'Awa', nom: 'Koné', fullName: 'Awa Koné', email: 'awa.kone@elfarouk.ml', telephone: '+223 66 77 88 99', matierePrincipale: 'Histoire-Géographie', grade: 'Certifié', dateEmbauche: '2015-09-01', hourlyRate: 2000,
            affectations: [{ classe: '3ème Année A', matiere: 'Histoire-Géographie' }, { classe: '3ème Année B', matiere: 'Histoire-Géographie' }, { classe: '4ème Année A', matiere: 'Histoire-Géographie' }, { classe: '4ème Année B', matiere: 'Histoire-Géographie' }]
        },
        {
            id: 22, prenom: 'Cheick', nom: 'Bah', fullName: 'Cheick Bah', email: 'cheick.bah@elfarouk.ml', telephone: '+223 76 88 99 00', matierePrincipale: 'Anglais', grade: 'Contractuel', dateEmbauche: '2020-09-01', hourlyRate: 1800,
            affectations: [{ classe: '3ème Année A', matiere: 'Anglais' }, { classe: '3ème Année B', matiere: 'Anglais' }, { classe: '4ème Année A', matiere: 'Anglais' }, { classe: '4ème Année B', matiere: 'Anglais' }]
        },
        {
            id: 23, prenom: 'Assitou', nom: 'Dembélé', fullName: 'Assitou Dembélé', email: 'assitou.dembele@elfarouk.ml', telephone: '+223 65 99 00 11', matierePrincipale: 'EPS', grade: 'Contractuel', dateEmbauche: '2021-09-01', hourlyRate: 1500,
            affectations: [{ classe: '3ème Année A', matiere: 'EPS' }, { classe: '3ème Année B', matiere: 'EPS' }, { classe: '4ème Année A', matiere: 'EPS' }, { classe: '4ème Année B', matiere: 'EPS' }, { classe: '5ème Année A', matiere: 'EPS' }, { classe: '5ème Année B', matiere: 'EPS' }, { classe: '5ème Année C', matiere: 'EPS' }, { classe: '6ème Année A', matiere: 'EPS' }, { classe: '6ème Année B', matiere: 'EPS' }, { classe: '6ème Année C', matiere: 'EPS' }]
        },
        {
            id: 24, prenom: 'Mamadou', nom: 'Sanogo', fullName: 'Mamadou Sanogo', email: 'mamadou.sanogo@elfarouk.ml', telephone: '+223 79 00 11 22', matierePrincipale: 'Mathématiques', grade: 'Titulaire', dateEmbauche: '2011-09-01', hourlyRate: 2500,
            affectations: [{ classe: '5ème Année A', matiere: 'Mathématiques' }, { classe: '5ème Année B', matiere: 'Mathématiques' }, { classe: '5ème Année C', matiere: 'Mathématiques' }, { classe: '6ème Année A', matiere: 'Mathématiques' }, { classe: '6ème Année B', matiere: 'Mathématiques' }, { classe: '6ème Année C', matiere: 'Mathématiques' }]
        },
        {
            id: 25, prenom: 'Oumou', nom: 'Kané', fullName: 'Oumou Kané', email: 'oumou.kane@elfarouk.ml', telephone: '+223 66 11 22 33', matierePrincipale: 'Français', grade: 'Certifié', dateEmbauche: '2017-09-01', hourlyRate: 2000,
            affectations: [{ classe: '5ème Année A', matiere: 'Français' }, { classe: '5ème Année B', matiere: 'Français' }, { classe: '5ème Année C', matiere: 'Français' }, { classe: '6ème Année A', matiere: 'Français' }, { classe: '6ème Année B', matiere: 'Français' }, { classe: '6ème Année C', matiere: 'Français' }]
        },
        {
            id: 26, prenom: 'Bourama', nom: 'Coulibaly', fullName: 'Bourama Coulibaly', email: 'bourama.coulibaly@elfarouk.ml', telephone: '+223 76 22 33 44', matierePrincipale: 'Sciences Naturelles', grade: 'Contractuel', dateEmbauche: '2018-09-01', hourlyRate: 1800,
            affectations: [{ classe: '5ème Année A', matiere: 'Sciences Naturelles' }, { classe: '5ème Année B', matiere: 'Sciences Naturelles' }, { classe: '5ème Année C', matiere: 'Sciences Naturelles' }, { classe: '6ème Année A', matiere: 'Sciences Naturelles' }, { classe: '6ème Année B', matiere: 'Sciences Naturelles' }, { classe: '6ème Année C', matiere: 'Sciences Naturelles' }]
        },
        {
            id: 27, prenom: 'Fatoumata', nom: 'Sanogo', fullName: 'Fatoumata Sanogo', email: 'fatoumata.sanogo@elfarouk.ml', telephone: '+223 65 33 44 55', matierePrincipale: 'Histoire-Géographie', grade: 'Certifié', dateEmbauche: '2016-09-01', hourlyRate: 2000,
            affectations: [{ classe: '5ème Année A', matiere: 'Histoire-Géographie' }, { classe: '5ème Année B', matiere: 'Histoire-Géographie' }, { classe: '5ème Année C', matiere: 'Histoire-Géographie' }, { classe: '6ème Année A', matiere: 'Histoire-Géographie' }, { classe: '6ème Année B', matiere: 'Histoire-Géographie' }, { classe: '6ème Année C', matiere: 'Histoire-Géographie' }]
        },
        {
            id: 28, prenom: 'Karim', nom: 'Diallo', fullName: 'Karim Diallo', email: 'karim.diallo@elfarouk.ml', telephone: '+223 79 44 55 66', matierePrincipale: 'Anglais', grade: 'Contractuel', dateEmbauche: '2019-09-01', hourlyRate: 1800,
            affectations: [{ classe: '5ème Année A', matiere: 'Anglais' }, { classe: '5ème Année B', matiere: 'Anglais' }, { classe: '5ème Année C', matiere: 'Anglais' }, { classe: '6ème Année A', matiere: 'Anglais' }, { classe: '6ème Année B', matiere: 'Anglais' }, { classe: '6ème Année C', matiere: 'Anglais' }]
        },
        // ── 2ème CYCLE (8ème B/C, 9ème) — complétion ─────────────
        {
            id: 29, prenom: 'Mahamadou', nom: 'Diallo', fullName: 'Mahamadou Diallo', email: 'mahamadou.diallo@elfarouk.ml', telephone: '+223 66 55 66 77', matierePrincipale: 'Mathématiques', grade: 'Certifié', dateEmbauche: '2015-09-01', hourlyRate: 2200,
            affectations: [{ classe: '8ème Année B', matiere: 'Mathématiques' }, { classe: '8ème Année C', matiere: 'Mathématiques' }, { classe: '9ème Année A', matiere: 'Mathématiques' }, { classe: '9ème Année B', matiere: 'Mathématiques' }, { classe: '9ème Année C', matiere: 'Mathématiques' }]
        },
        {
            id: 30, prenom: 'Rokiatou', nom: 'Traoré', fullName: 'Rokiatou Traoré', email: 'rokiatou.traore@elfarouk.ml', telephone: '+223 76 66 77 88', matierePrincipale: 'Français', grade: 'Titulaire', dateEmbauche: '2014-09-01', hourlyRate: 2200,
            affectations: [{ classe: '7ème Année C', matiere: 'Français' }, { classe: '8ème Année B', matiere: 'Français' }, { classe: '8ème Année C', matiere: 'Français' }, { classe: '9ème Année A', matiere: 'Français' }, { classe: '9ème Année B', matiere: 'Français' }, { classe: '9ème Année C', matiere: 'Français' }]
        },
        {
            id: 31, prenom: 'Issa', nom: 'Koné', fullName: 'Issa Koné', email: 'issa.kone@elfarouk.ml', telephone: '+223 65 77 88 99', matierePrincipale: 'SVT', grade: 'Certifié', dateEmbauche: '2016-09-01', hourlyRate: 2000,
            affectations: [{ classe: '7ème Année C', matiere: 'SVT' }, { classe: '8ème Année B', matiere: 'SVT' }, { classe: '9ème Année A', matiere: 'SVT' }, { classe: '9ème Année B', matiere: 'SVT' }, { classe: '9ème Année C', matiere: 'SVT' }]
        },
        {
            id: 32, prenom: 'Aminata', nom: 'Bah', fullName: 'Aminata Bah', email: 'aminata.bah@elfarouk.ml', telephone: '+223 79 88 99 00', matierePrincipale: 'Histoire-Géographie', grade: 'Contractuel', dateEmbauche: '2018-09-01', hourlyRate: 1800,
            affectations: [{ classe: '7ème Année B', matiere: 'Histoire-Géographie' }, { classe: '7ème Année C', matiere: 'Histoire-Géographie' }, { classe: '8ème Année A', matiere: 'Histoire-Géographie' }, { classe: '8ème Année B', matiere: 'Histoire-Géographie' }, { classe: '8ème Année C', matiere: 'Histoire-Géographie' }, { classe: '9ème Année A', matiere: 'Histoire-Géographie' }, { classe: '9ème Année B', matiere: 'Histoire-Géographie' }, { classe: '9ème Année C', matiere: 'Histoire-Géographie' }]
        },
        {
            id: 33, prenom: 'Daouda', nom: 'Sissoko', fullName: 'Daouda Sissoko', email: 'daouda.sissoko@elfarouk.ml', telephone: '+223 66 99 00 11', matierePrincipale: 'Anglais', grade: 'Contractuel', dateEmbauche: '2020-09-01', hourlyRate: 1800,
            affectations: [{ classe: '7ème Année B', matiere: 'Anglais' }, { classe: '7ème Année C', matiere: 'Anglais' }, { classe: '8ème Année B', matiere: 'Anglais' }, { classe: '8ème Année C', matiere: 'Anglais' }, { classe: '9ème Année B', matiere: 'Anglais' }, { classe: '9ème Année C', matiere: 'Anglais' }]
        },
        {
            id: 34, prenom: 'Moumine', nom: 'Coulibaly', fullName: 'Moumine Coulibaly', email: 'moumine.coulibaly@elfarouk.ml', telephone: '+223 76 00 11 22', matierePrincipale: 'Physique-Chimie', grade: 'Certifié', dateEmbauche: '2017-09-01', hourlyRate: 2200,
            affectations: [{ classe: '8ème Année B', matiere: 'Physique-Chimie' }, { classe: '8ème Année C', matiere: 'Physique-Chimie' }, { classe: '9ème Année A', matiere: 'Physique-Chimie' }, { classe: '9ème Année B', matiere: 'Physique-Chimie' }, { classe: '9ème Année C', matiere: 'Physique-Chimie' }]
        },
        {
            id: 35, prenom: 'Mariam', nom: 'Diakalo', fullName: 'Mariam Diakalo', email: 'mariam.diakalo@elfarouk.ml', telephone: '+223 65 11 22 33', matierePrincipale: 'EPS', grade: 'Contractuel', dateEmbauche: '2021-09-01', hourlyRate: 1500,
            affectations: [{ classe: '7ème Année A', matiere: 'EPS' }, { classe: '7ème Année B', matiere: 'EPS' }, { classe: '7ème Année C', matiere: 'EPS' }, { classe: '8ème Année A', matiere: 'EPS' }, { classe: '8ème Année B', matiere: 'EPS' }, { classe: '8ème Année C', matiere: 'EPS' }, { classe: '9ème Année A', matiere: 'EPS' }, { classe: '9ème Année B', matiere: 'EPS' }, { classe: '9ème Année C', matiere: 'EPS' }]
        },
        // ── LYCÉE (complétion filières L et ES + Anglais) ────────
        {
            id: 36, prenom: 'Seydou', nom: 'Ballo', fullName: 'Seydou Ballo', email: 'seydou.ballo@elfarouk.ml', telephone: '+223 79 11 22 33', matierePrincipale: 'Anglais', grade: 'Certifié', dateEmbauche: '2014-09-01', hourlyRate: 2500,
            affectations: [{ classe: '10ème S', matiere: 'Anglais' }, { classe: '10ème L', matiere: 'Anglais' }, { classe: '10ème ES', matiere: 'Anglais' }, { classe: '11ème S', matiere: 'Anglais' }, { classe: '11ème L', matiere: 'Anglais' }, { classe: '11ème ES', matiere: 'Anglais' }, { classe: '12ème S', matiere: 'Anglais' }, { classe: '12ème L', matiere: 'Anglais' }, { classe: '12ème ES', matiere: 'Anglais' }]
        },
        {
            id: 37, prenom: 'Djeneba', nom: 'Coulibaly', fullName: 'Djeneba Coulibaly', email: 'djeneba.coulibaly@elfarouk.ml', telephone: '+223 66 22 33 44', matierePrincipale: 'SVT', grade: 'Agrégé', dateEmbauche: '2010-09-01', hourlyRate: 3500,
            affectations: [{ classe: '10ème S', matiere: 'SVT' }, { classe: '10ème L', matiere: 'SVT' }, { classe: '10ème ES', matiere: 'SVT' }, { classe: '11ème S', matiere: 'SVT' }, { classe: '12ème S', matiere: 'SVT' }]
        },
        {
            id: 38, prenom: 'Boubacar', nom: 'Diallo', fullName: 'Boubacar Diallo', email: 'boubacar.diallo@elfarouk.ml', telephone: '+223 76 33 44 55', matierePrincipale: 'Histoire-Géographie', grade: 'Agrégé', dateEmbauche: '2008-09-01', hourlyRate: 3500,
            affectations: [{ classe: '10ème S', matiere: 'Histoire-Géographie' }, { classe: '10ème L', matiere: 'Histoire-Géographie' }, { classe: '10ème ES', matiere: 'Histoire-Géographie' }, { classe: '11ème L', matiere: 'Histoire-Géographie' }, { classe: '11ème ES', matiere: 'Histoire-Géographie' }, { classe: '12ème L', matiere: 'Histoire-Géographie' }, { classe: '12ème ES', matiere: 'Histoire-Géographie' }]
        },
        {
            id: 39, prenom: 'Ibrahim', nom: 'Marega', fullName: 'Ibrahim Marega', email: 'ibrahim.marega@elfarouk.ml', telephone: '+223 65 44 55 66', matierePrincipale: 'Informatique', grade: 'Certifié', dateEmbauche: '2018-09-01', hourlyRate: 2500,
            affectations: [{ classe: '10ème S', matiere: 'Informatique' }, { classe: '10ème L', matiere: 'Informatique' }, { classe: '10ème ES', matiere: 'Informatique' }, { classe: '11ème S', matiere: 'Informatique' }, { classe: '11ème L', matiere: 'Informatique' }, { classe: '11ème ES', matiere: 'Informatique' }]
        },
        {
            id: 40, prenom: 'Nana', nom: 'Konaté', fullName: 'Nana Konaté', email: 'nana.konate@elfarouk.ml', telephone: '+223 79 55 66 77', matierePrincipale: 'EPS', grade: 'Contractuel', dateEmbauche: '2020-09-01', hourlyRate: 1800,
            affectations: [{ classe: '10ème S', matiere: 'EPS' }, { classe: '10ème L', matiere: 'EPS' }, { classe: '10ème ES', matiere: 'EPS' }, { classe: '11ème S', matiere: 'EPS' }, { classe: '11ème L', matiere: 'EPS' }, { classe: '11ème ES', matiere: 'EPS' }, { classe: '12ème S', matiere: 'EPS' }, { classe: '12ème L', matiere: 'EPS' }, { classe: '12ème ES', matiere: 'EPS' }]
        },
        {
            id: 41, prenom: 'Mariam', nom: 'Keita', fullName: 'Mariam Keita', email: 'mariam.keita2@elfarouk.ml', telephone: '+223 66 66 77 88', matierePrincipale: 'Français', grade: 'Agrégé', dateEmbauche: '2009-09-01', hourlyRate: 3500,
            affectations: [{ classe: '10ème S', matiere: 'Français' }, { classe: '10ème ES', matiere: 'Français' }, { classe: '11ème ES', matiere: 'Français' }, { classe: '12ème ES', matiere: 'Français' }]
        },
        // ── LYCÉE — Maths filière L et ES ─────────────────────────
        {
            id: 42, prenom: 'Ousmane', nom: 'Diarra', fullName: 'Ousmane Diarra', email: 'ousmane.diarra@elfarouk.ml', telephone: '+223 76 77 88 99', matierePrincipale: 'Mathématiques', grade: 'Certifié', dateEmbauche: '2015-09-01', hourlyRate: 2500,
            affectations: [{ classe: '10ème L', matiere: 'Mathématiques' }, { classe: '10ème ES', matiere: 'Mathématiques' }, { classe: '11ème L', matiere: 'Mathématiques' }, { classe: '11ème ES', matiere: 'Mathématiques' }, { classe: '12ème L', matiere: 'Mathématiques' }, { classe: '12ème ES', matiere: 'Mathématiques' }]
        },
        {
            id: 43, prenom: 'Kadiatou', nom: 'Barry', fullName: 'Kadiatou Barry', email: 'kadia.barry@elfarouk.ml', telephone: '+223 65 88 99 00', matierePrincipale: 'Physique-Chimie', grade: 'Certifié', dateEmbauche: '2017-09-01', hourlyRate: 2500,
            affectations: [{ classe: '10ème L', matiere: 'Physique-Chimie' }, { classe: '10ème ES', matiere: 'Physique-Chimie' }, { classe: '11ème L', matiere: 'Physique-Chimie' }, { classe: '11ème ES', matiere: 'Physique-Chimie' }, { classe: '12ème L', matiere: 'Physique-Chimie' }, { classe: '12ème ES', matiere: 'Physique-Chimie' }]
        },
        // ── LYCÉE ──────────────────────────────────────────────
        {
            id: 13, prenom: 'Mohamed', nom: 'Doumbia', email: 'mohamed.doumbia@elfarouk.ml',
            telephone: '+223 76 33 44 55', matierePrincipale: 'Mathématiques',
            grade: 'Agrégé', dateEmbauche: '2005-09-01', hourlyRate: 4000,
            fullName: 'Mohamed Doumbia',
            affectations: [
                { classe: '10ème S', matiere: 'Mathématiques' },
                { classe: '11ème S', matiere: 'Mathématiques' },
                { classe: '12ème S', matiere: 'Mathématiques' }
            ]
        },
        {
            id: 14, prenom: 'Rokia', nom: 'Cissé', email: 'rokia.cisse@elfarouk.ml',
            telephone: '+223 67 44 55 66', matierePrincipale: 'Philosophie',
            grade: 'Agrégé', dateEmbauche: '2007-09-01', hourlyRate: 3500,
            fullName: 'Rokia Cissé',
            affectations: [
                { classe: '12ème S', matiere: 'Philosophie' },
                { classe: '12ème L', matiere: 'Philosophie' },
                { classe: '12ème ES', matiere: 'Philosophie' }
            ]
        },
        {
            id: 15, prenom: 'Djeneba', nom: 'Barry', email: 'djeneba.barry@elfarouk.ml',
            telephone: '+223 76 55 66 77', matierePrincipale: 'Français',
            grade: 'Agrégé', dateEmbauche: '2010-09-01', hourlyRate: 3500,
            fullName: 'Djeneba Barry',
            affectations: [
                { classe: '10ème L', matiere: 'Français' },
                { classe: '11ème L', matiere: 'Français' },
                { classe: '12ème L', matiere: 'Français' }
            ]
        },
        {
            id: 16, prenom: 'Seydou', nom: 'Kouyaté', email: 'seydou.kouyate@elfarouk.ml',
            telephone: '+223 65 66 77 88', matierePrincipale: 'Physique-Chimie',
            grade: 'Agrégé', dateEmbauche: '2009-09-01', hourlyRate: 4000,
            fullName: 'Seydou Kouyaté',
            affectations: [
                { classe: '10ème S', matiere: 'Physique-Chimie' },
                { classe: '11ème S', matiere: 'Physique-Chimie' },
                { classe: '12ème S', matiere: 'Physique-Chimie' }
            ]
        },
        {
            id: 17, prenom: 'Aïssata', nom: 'Togola', email: 'aissata.togola@elfarouk.ml',
            telephone: '+223 79 77 88 99', matierePrincipale: 'Économie',
            grade: 'Certifié', dateEmbauche: '2016-09-01', hourlyRate: 2500,
            fullName: 'Aïssata Togola',
            affectations: [
                { classe: '10ème ES', matiere: 'Économie' },
                { classe: '11ème ES', matiere: 'Économie' },
                { classe: '12ème ES', matiere: 'Économie' }
            ]
        }
    ];

    /**
     * MATIÈRES — liées aux cycles et années où elles sont enseignées.
     * Les coefficients varient selon le niveau scolaire réel.
     */
    public matieres: Matiere[] = [
        { id: 1, nom: 'Mathématiques', code: 'MATH', coefficient: 4, cycle: '1er CYCLE', couleur: '#4a6cf7', annees: ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année'], description: 'Arithmétique, géométrie, algèbre.' },
        { id: 2, nom: 'Français', code: 'FRAN', coefficient: 4, cycle: '1er CYCLE', couleur: '#10b981', annees: ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année'], description: 'Lecture, rédaction, grammaire.' },
        { id: 3, nom: 'Sciences Naturelles', code: 'SCI', coefficient: 3, cycle: '1er CYCLE', couleur: '#43aa8b', annees: ['1ère Année', '2ème Année', '3ème Année', '4ème Année'], description: 'Biologie végétale et animale.' },
        { id: 4, nom: 'Histoire-Géographie', code: 'HIST', coefficient: 3, cycle: '1er CYCLE', couleur: '#ef4444', annees: ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année'], description: 'Histoire du Mali et géographie africaine.' },
        { id: 5, nom: 'Anglais', code: 'ANGL', coefficient: 3, cycle: '1er CYCLE', couleur: '#f59e0b', annees: ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année'], description: 'Langue anglaise — niveau débutant à intermédiaire.' },
        { id: 6, nom: 'EPS', code: 'EPS', coefficient: 2, cycle: '1er CYCLE', couleur: '#ff9a3d', annees: ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année', '6ème Année'], description: 'Éducation physique et sportive.' },
        { id: 7, nom: 'Mathématiques', code: 'MATH', coefficient: 5, cycle: '2ème CYCLE', couleur: '#4a6cf7', annees: ['7ème Année', '8ème Année', '9ème Année'], description: 'Algèbre, géométrie analytique, statistiques.' },
        { id: 8, nom: 'Français', code: 'FRAN', coefficient: 4, cycle: '2ème CYCLE', couleur: '#10b981', annees: ['7ème Année', '8ème Année', '9ème Année'], description: 'Littérature, dissertation, expression écrite.' },
        { id: 9, nom: 'Physique-Chimie', code: 'PHY', coefficient: 4, cycle: '2ème CYCLE', couleur: '#06b6d4', annees: ['7ème Année', '8ème Année', '9ème Année'], description: 'Mécanique, électricité, chimie organique.' },
        { id: 10, nom: 'SVT', code: 'SVT', coefficient: 3, cycle: '2ème CYCLE', couleur: '#8b5cf6', annees: ['7ème Année', '8ème Année', '9ème Année'], description: 'Sciences de la vie et de la terre.' },
        { id: 11, nom: 'Anglais', code: 'ANGL', coefficient: 3, cycle: '2ème CYCLE', couleur: '#f59e0b', annees: ['7ème Année', '8ème Année', '9ème Année'], description: 'Anglais intermédiaire à avancé.' },
        { id: 12, nom: 'Histoire-Géographie', code: 'HIST', coefficient: 3, cycle: '2ème CYCLE', couleur: '#ef4444', annees: ['7ème Année', '8ème Année', '9ème Année'], description: 'Géopolitique, histoire contemporaine.' },
        { id: 13, nom: 'Mathématiques', code: 'MATH', coefficient: 6, cycle: 'LYCÉE', couleur: '#4a6cf7', annees: ['10ème (Seconde)', '11ème (Première)', '12ème (Terminale)'], description: 'Analyse, probabilités, géométrie dans l\'espace.' },
        { id: 14, nom: 'Physique-Chimie', code: 'PHY', coefficient: 5, cycle: 'LYCÉE', couleur: '#06b6d4', annees: ['10ème (Seconde)', '11ème (Première)', '12ème (Terminale)'], description: 'Thermodynamique, optique, électronique.' },
        { id: 15, nom: 'SVT', code: 'SVT', coefficient: 4, cycle: 'LYCÉE', couleur: '#8b5cf6', annees: ['10ème (Seconde)', '11ème (Première)', '12ème (Terminale)'], description: 'Génétique, écologie, physiologie humaine.' },
        { id: 16, nom: 'Philosophie', code: 'PHIL', coefficient: 4, cycle: 'LYCÉE', couleur: '#9d4edd', annees: ['12ème (Terminale)'], description: 'Épistémologie, éthique, métaphysique.' },
        { id: 17, nom: 'Français', code: 'FRAN', coefficient: 4, cycle: 'LYCÉE', couleur: '#10b981', annees: ['10ème (Seconde)', '11ème (Première)', '12ème (Terminale)'], description: 'Littérature, commentaire composé.' },
        { id: 18, nom: 'Économie', code: 'ECO', coefficient: 5, cycle: 'LYCÉE', couleur: '#ff6b6b', annees: ['10ème (Seconde)', '11ème (Première)', '12ème (Terminale)'], description: 'Microéconomie, macroéconomie, gestion.' },
        { id: 19, nom: 'Anglais', code: 'ANGL', coefficient: 3, cycle: 'LYCÉE', couleur: '#f59e0b', annees: ['10ème (Seconde)', '11ème (Première)', '12ème (Terminale)'], description: 'Anglais avancé — TOEFL/IELTS.' },
        { id: 20, nom: 'Informatique', code: 'INFO', coefficient: 2, cycle: 'LYCÉE', couleur: '#3a9d9d', annees: ['10ème (Seconde)', '11ème (Première)'], description: 'Algorithmique, bureautique, réseaux.' }
    ];

    /** Entrées du cahier de texte (persistées en localStorage) */
    public logbookEntries: LogbookEntry[] = [];

    // ─── PERSISTANCE DES PRÉFÉRENCES ────────────────────────────
    private _includeSamedi: boolean = true;
    public get includeSamedi(): boolean { return this._includeSamedi; }
    public set includeSamedi(val: boolean) {
        this._includeSamedi = val;
        this.savePreferences();
    }

    /** Grilles horaires personnalisées par classe (classe -> SlotConfig[]) */
    private _customSlotsByClass: Map<string, SlotConfig[]> = new Map();

    public getCustomSlots(classe: string): SlotConfig[] {
        if (this._customSlotsByClass.has(classe)) {
            return this._customSlotsByClass.get(classe)!;
        }
        return [
            { id: 's1', startTime: '08:00', endTime: '09:00', isPause: false },
            { id: 's2', startTime: '09:00', endTime: '10:00', isPause: false },
            { id: 'p1', startTime: '10:00', endTime: '10:15', isPause: true, name: 'Récréation' },
            { id: 's3', startTime: '10:15', endTime: '11:15', isPause: false },
            { id: 's4', startTime: '11:15', endTime: '12:15', isPause: false },
            { id: 'p2', startTime: '12:15', endTime: '13:00', isPause: true, name: 'Pause Déjeuner' },
            { id: 's5', startTime: '13:00', endTime: '14:00', isPause: false },
            { id: 's6', startTime: '14:00', endTime: '15:00', isPause: false },
            { id: 'p3', startTime: '15:00', endTime: '15:15', isPause: true, name: 'Récréation' },
            { id: 's7', startTime: '15:15', endTime: '16:15', isPause: false }
        ];
    }

    public setCustomSlots(classe: string, slots: SlotConfig[]): void {
        this._customSlotsByClass.set(classe, slots);
        this.savePreferences();
    }

    private savePreferences(): void {
        const data = {
            includeSamedi: this._includeSamedi,
            customSlots: Array.from(this._customSlotsByClass.entries()).map(([classe, slots]) => ({ classe, slots }))
        };
        localStorage.setItem('school_preferences_v1', JSON.stringify(data));
    }

    private loadPreferences(): void {
        try {
            const raw = localStorage.getItem('school_preferences_v1');
            if (raw) {
                const data = JSON.parse(raw);
                this._includeSamedi = data.includeSamedi ?? true;
                this._customSlotsByClass = new Map();
                if (data.customSlots) {
                    for (const item of data.customSlots) {
                        this._customSlotsByClass.set(item.classe, item.slots);
                    }
                }
            }
        } catch { /* ignore */ }
    }

    public saveLogbook(): void {
        localStorage.setItem('school_logbook_v1', JSON.stringify(this.logbookEntries));
    }

    private loadLogbook(): void {
        try {
            const d = localStorage.getItem('school_logbook_v1');
            this.logbookEntries = d ? JSON.parse(d) : [];
        } catch { this.logbookEntries = []; }
    }

    // ═══════════════════ ÉLÈVES CENTRALISÉS ═══════════════════
    private _eleves: Eleve[] = [];

    constructor() {
        this.loadPreferences();
        this.loadLogbook();
        this.loadEleves();
    }

    /** Liste complète (lecture seule) */
    get tousLesEleves(): Eleve[] {
        return [...this._eleves];
    }

    /** Élèves d'une classe donnée */
    elevesPourClasse(classe: string): Eleve[] {
        return this._eleves.filter(e => e.classe === classe);
    }

    /** Ajouter un élève (via le composant Eleves) */
    ajouterEleve(eleve: Eleve): void {
        if (!eleve.id) {
            const maxId = this._eleves.length > 0 ? Math.max(...this._eleves.map(e => e.id)) : 0;
            eleve.id = maxId + 1;
        }
        if (!eleve.fullName) {
            eleve.fullName = `${eleve.prenom} ${eleve.nom}`;
        }
        this._eleves.push(eleve);
        this.sauvegarderEleves();
    }

    /** Modifier un élève existant */
    modifierEleve(eleve: Eleve): void {
        const index = this._eleves.findIndex(e => e.id === eleve.id);
        if (index !== -1) {
            this._eleves[index] = eleve;
            this.sauvegarderEleves();
        }
    }

    /** Supprimer un élève */
    supprimerEleve(id: number): void {
        this._eleves = this._eleves.filter(e => e.id !== id);
        this.sauvegarderEleves();
    }

    /** Initialisation avec des données de démonstration (appelée si vide ou obsolète) */
    private initialiserElevesDemo(): void {
        // Vider d'abord les anciennes données
        this._eleves = [];
        const prenoms = ['Issa', 'Awa', 'Moussa', 'Fatoumata', 'Sékou', 'Nana', 'Amadou', 'Kadiatou'];
        const noms = ['Traoré', 'Keïta', 'Cissé', 'Diallo', 'Coulibaly', 'Koné', 'Sangaré', 'Marega'];
        let id = 1;
        this.toutesLesClasses().forEach(classe => {
            const nb = Math.floor(Math.random() * 10) + 15; // 15-25
            for (let i = 0; i < nb; i++) {
                const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
                const nom = noms[Math.floor(Math.random() * noms.length)];
                const presence = Math.random() > 0.2 ? 'Présent' : 'Absent';
                this._eleves.push({
                    id: id++,
                    prenom,
                    nom,
                    fullName: `${prenom} ${nom}`,
                    classe,
                    notes: { maths: '00.0', francais: '00.0', anglais: '00.0' },
                    presence,
                    email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@ecole.ml`,
                    telephone: `+223 ${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
                    parent: `${noms[Math.floor(Math.random() * noms.length)]} ${prenom === 'Issa' ? 'Moussa' : 'Fatoumata'}`
                });
            }
        });
        this.sauvegarderEleves();
    }

    private sauvegarderEleves(): void {
        localStorage.setItem('school_eleves_v1', JSON.stringify(this._eleves));
    }

    private loadEleves(): void {
        try {
            const data = localStorage.getItem('school_eleves_v1');
            if (data) {
                this._eleves = JSON.parse(data);
                // Vérifie si les données sont obsolètes (ancienne génération "Élève1")
                if (this.estDonneeObsolete()) {
                    console.warn('Données élèves obsolètes détectées, régénération…');
                    this.initialiserElevesDemo();
                }
            } else {
                this.initialiserElevesDemo();
            }
        } catch {
            this._eleves = [];
        }
    }

    private estDonneeObsolete(): boolean {
        if (this._eleves.length === 0) return false;
        return this._eleves[0].prenom.startsWith('Élève');
    }

    // ══════════════ MÉTHODES UTILITAIRES ══════════════
    public classesPourAnnee(anneeNom: string): string[] {
        const letters = ['A', 'B', 'C', 'D'];
        const annee = this.cycles.flatMap(c => c.annees).find(a => a.nom === anneeNom);
        if (!annee) return [];
        if (annee.filieres) return annee.filieres.map(f => `${anneeNom.split(' ')[0]} ${f}`);
        return Array.from({ length: annee.nbClasses }, (_, i) => `${anneeNom} ${letters[i]}`);
    }

    public enseignantsPourClasse(classe: string): Enseignant[] {
        return this.enseignants.filter(e => e.affectations.some(a => a.classe === classe));
    }

    public matieresPourClasse(classe: string): { matiere: string; enseignant: Enseignant | undefined }[] {
        const result: { matiere: string; enseignant: Enseignant | undefined }[] = [];
        this.enseignants.forEach(e => {
            e.affectations.filter(a => a.classe === classe).forEach(a => {
                if (!result.find(r => r.matiere === a.matiere)) {
                    result.push({ matiere: a.matiere, enseignant: e });
                }
            });
        });
        return result;
    }

    public classesPourEnseignant(enseignantId: number): string[] {
        const e = this.enseignants.find(x => x.id === enseignantId);
        return e ? [...new Set(e.affectations.map(a => a.classe))] : [];
    }

    public toutesLesClasses(): string[] {
        return this.cycles.flatMap(c => c.annees.flatMap(a => this.classesPourAnnee(a.nom)));
    }

    public getSlotsForWeek(classe: string, lundi: Date): string[] {
        // … (inchangé)
        return [];
    }

    private getWeekDates(lundi: Date): Date[] {
        const days = this.includeSamedi ? 6 : 5;
        const dates: Date[] = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(lundi);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    }

    private formatDateIso(d: Date): string {
        return d.toISOString().split('T')[0];
    }

    public get visibleDaysCount(): number {
        return this.includeSamedi ? 6 : 5;
    }
}