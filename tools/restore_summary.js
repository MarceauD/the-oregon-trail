const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'saves', 'eddy', 'summary.txt');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Keep everything before line 371 (which is index 370)
const cleanLines = lines.slice(0, 370);

const restoredContent = cleanLines.join('\n') + `
### 26 juillet 1868
- **Déplacements & Actions** :
  - Eddy se réveille dans une cabane avec Benjamin. Entendant Eugene Dunbar approcher, il cache Benjamin à l'étage et s'enfonce dans les bois.
  - Il observe Eugene Dunbar, le traqueur Glenn et Theodore McNamera (blessé). McNamera cède sous la menace et indique la cachette d'Eddy.
  - Eddy s'enfuit en courant vers le camp des charbonniers pour demander de l'aide et convainc Artus Flynn de le suivre avec son fusil.
  - De retour à la cabane, Glenn capture Benjamin. Eugene tire sur Eddy, puis Artus Flynn abat Eugene d'un coup de fusil. Glenn s'enfuit.
  - Eddy et Theodore sont soignés au camp des charbonniers, puis retournent à la cabane pour enterrer le corps d'Eugene.
  - Eddy retourne au camp des charbonniers pour tenter de récupérer Benjamin, mais l'enfant refuse et choisit de rester avec Artus Flynn.
  - Eddy et Theodore retournent en charrette à la ferme McNamera.
  - Eddy rend visite à Finn, blessé dans la chambre de Samuel McNamera, et lui raconte l'ensemble de ses aventures récentes.
  - Eddy dîne avec Elara McNamera et s'endort dans le salon de la ferme.
- **Rencontres & Interactions** :
  - Eugene Dunbar : Retrouve Eddy, blesse Theodore, tire sur Eddy et finit abattu par Artus Flynn.
  - Glenn (traqueur) : Capture Benjamin puis s'enfuit après la mort d'Eugene.
  - Artus Flynn : Convaincu par Eddy d'intervenir, il tue Eugene pour protéger Benjamin et décide de garder l'enfant avec lui. Il charge Eddy de dire à Silas Flynn qu'il est prêt à revenir à sa table.
  - Benjamin : Capturé par Glenn, il refuse ensuite de suivre Eddy et choisit de rester avec Artus Flynn.
  - Theodore McNamera : Venu pour Eddy, il est blessé à la cuisse par Eugene. Il aide à enterrer Eugene, confisque son Colt Army 1860 inerte et ramène Eddy à la ferme.
  - Elara McNamera : Accueille Theodore et Eddy blessés, panse leurs blessures, permet à Eddy de voir Finn et lui offre un dessin de son défunt fils Samuel McNamera.
  - Finn : Blessé aux côtes lors d'un duel truqué avec Morris Diamond il y a deux ou trois jours, il est soigné à la ferme et écoute le récit d'Eddy.
- **Santé & Ressources** :
  - Blessures physiques : Blessure par balle perforante au bras gauche pour Eddy, blessure par balle à la cuisse gauche pour Theodore, et blessure par balle aux côtes pour Finn.
  - Santé mentale : Eddy acquiert le point faible « Regret » (niveau 8/10), un traumatisme lié à la mort d'Eugene (panique face aux armes, à la poudre et à la mort) et un traumatisme lié à la perte de Benjamin (difficulté à prendre des responsabilités envers autrui).
  - Gains d'inventaire d'Eddy : 3 dollars et 54 cents, un trousseau de clés, un daguerréotype, une gourde en fer blanc vide ("E.D.") prélevés sur Eugene, et un dessin au fusain d'un cerf ayant appartenu à Samuel McNamera.
  - Pertes d'inventaire : Le banjo d'Eddy est définitivement détruit (une corde métallique est donnée à Finn en guise de fil de pêche). Benjamin quitte définitivement la garde d'Eddy.
  - Autre gain : Theodore conserve le Colt Army 1860 démonté d'Eugene.

### 27 juillet 1868
- **Déplacements & Actions** :
  - Réveil au lever du soleil dans la pièce principale de la ferme McNamera.
  - Eddy constate l'absence de fièvre et l'état stable de sa blessure au bras (Jet d'Endurance réussi : 24/80).
  - Aide Elara en cuisine de sa seule main valide pour préparer un petit-déjeuner gigantesque (lard salé, saucisses, Johnnycakes, œufs, pommes de terre, chicorée).
  - Apprend l'origine du terme « Johnnycakes » (anciennement « Shawnee cakes ») (Jet de Perception échoué : 69/65).
  - Repas partagé en silence avec Elara et Theodore, qui les rejoint péniblement malgré sa jambe blessée et la fièvre.
  - Arrivée du docteur Charles Russell, qui ausculte les blessés. Il diagnostique une balle restée dans la cuisse de Theodore (risque d'infection mortelle) et un saignement interne sous la peau pour le bras d'Eddy.
  - Eddy pousse le docteur à ausculter Finn en priorité à cause de son état délirant.
  - Eddy sert d'assistant médical de sa main valide (maintien de Finn pendant les soins et versement de l'eau phéniquée sur sa blessure) (Jet de Dextérité réussi : 27/40).
  - Elara débarrasse la table de cuisine pour la transformer en table d'opération.
  - Chirurgie de Theodore : Eddy est réquisitionné comme assistant mais lâche la lampe et s'évanouit sous le coup de la douleur, de la chaleur et du trauma (Dextérité : 79/40 échec, Endurance : 100/80 échec critique). Elara rattrape la lampe au vol.
  - Pendant son inconscience, Eddy affronte sous forme de combat d'esprit le spectre de Regret (sous la forme d'un serpent humanoïde) et le repousse de force dans les ténèbres (Résilience : 02/85 succès critique).
  - Réveil et opération d'Eddy : le docteur Russell nettoie sa plaie d'épaule, en extrait deux fragments d'os et recoud la chair.
  - Eddy paie 0,87 $ à Russell pour lui faire lire l'article de journal sur ses origines (Persuasion : 09/74 réussite). L'article de mai 1850 du *Harrisburg Telegraph* révèle que sa mère, Connie Devlin, s'est pendue de misère après la mort de son époux, le laissant orphelin à trois mois. Cette vérité apporte un immense soulagement à Eddy.
  - Eddy offre ses cadeaux taillés dans le bois de son banjo : la broche en bois à Elara et le bourre-pipe à Theodore. Elara l'enlace chaleureusement.
  - Toilette d'Eddy : en voulant retirer son pantalon raide d'une seule main, Eddy perd l'équilibre et renverse sa bassine d'eau chaude (Agilité : 70/50 échec). Elara l'aide, nettoie le plancher à la sciure, le lave, lui coupe les cheveux, le rase et l'habille avec les vêtements de Samuel. Eddy combat la panique de devoir remplacer leur fils décédé.
  - Discussion en fin de journée avec Theodore dans sa chambre : Theodore lui propose de s'installer définitivement à la ferme. Eddy décline avec honnêteté au nom de son rêve d'Oregon, mais promet de rester pour aider le temps de leur convalescence. Theodore accepte avec tristesse et dignité, puis annonce l'arrivée de Silas Flynn le lendemain pour convoyer les 60 sacs de blé restants vers Carlisle.
  - Dîner sommaire de pain de seigle au saindoux et chicorée, changement de pansement par Elara, mot bref à Finn dans sa chambre et installation pour la nuit sur le plancher du salon.
- **Rencontres & Interactions** :
  - **Elara McNamera** : Aide à la cuisine, assiste le docteur, soigne et habille Eddy avec les nippes de Samuel avant de changer ses pansements le soir.
  - **Theodore McNamera** : Subit l'extraction de balle à vif, accepte avec philosophie le refus d'Eddy de s'installer à demeure et le remercie pour son honnêteté. Organise la venue de Silas.
  - **Dr. Charles Russell** : Opère Theodore et Eddy, soigne Finn, lit le journal d'Eddy pour 0,87 $ et repart en fin de matinée.
  - **Finn** : Soigné au poumon et à la côte brisée, assommé de quinine et de laudanum, il reprend brièvement conscience le soir.
- **Santé & Ressources** :
  - **Santé physique** : Bras gauche d'Eddy recousu et immobilisé en écharpe (10 à 15 jours de convalescence).
  - **Santé mentale** : Résilience augmentée de +1% (passe à 86%). Le traumatisme de Regret retombe de 9/10 à **4/10** (les hallucinations cessent).
  - **Ressources** : Perte de 0,87 $ (solde à 12,38 $). Perte de la broche en bois sauvage et du bourre-pipe en noyer (offerts).
  - **Intrigues** : Clôture de l'intrigue « Retrouver les traces de ma famille biologique » (Terminé). Le fil « Un hôpital de campagne dans la cuisine » progresse.
  - **Savoirs** : Acquisition du savoir « Recette des Johnnycakes ».
`;

fs.writeFileSync(filePath, restoredContent, 'utf-8');
console.log("Summary file fully restored and updated!");
