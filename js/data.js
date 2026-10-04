/* Besoin d'Alchimie, prototype. Toutes les données de la bibliothèque.
   Les contenus sont fictifs mais écrits comme s'ils étaient définitifs.
   Aucune donnée de performance ici : rien n'est mesuré, tout est proposé. */

window.BA = window.BA || {};

BA.territoires = [
  { id: 'retrouver',   nom: 'Se retrouver',   phrase: 'Quand le quotidien a pris toute la place.', teinte: 'ambre' },
  { id: 'redecouvrir', nom: 'Se redécouvrir', phrase: 'Aimer quelqu’un longtemps, ce n’est pas avoir fini de le découvrir.', teinte: 'cuivre' },
  { id: 'dire',        nom: 'Se dire',        phrase: 'Les conversations qu’on n’aurait pas eues toutes seules.', teinte: 'terre' },
  { id: 'desirer',     nom: 'Se désirer',     phrase: 'L’élan qui ramène vers l’autre.', teinte: 'braise' },
  { id: 'vivre',       nom: 'Vivre',          phrase: 'Rire, sortir, jouer, cuisiner, se souvenir.', teinte: 'olive' }
];

/* Les cartes de l'accueil. Chaque envie pèse sur des territoires et des ambiances. */
BA.envies = [
  { id: 'bon-moment',  texte: 'On veut juste passer un bon moment',      territoires: ['vivre'],                    ambiances: ['leger', 'drole'] },
  { id: 'perdus',      texte: 'On s’est un peu perdus dans le quotidien', territoires: ['retrouver'],            ambiances: ['tendre', 'profond'] },
  { id: 'parler',      texte: 'On a envie de parler vraiment',           territoires: ['dire', 'redecouvrir'],      ambiances: ['profond'] },
  { id: 'rire',        texte: 'On a besoin de rire',                      territoires: ['vivre'],                    ambiances: ['drole'] },
  { id: 'routine',     texte: 'On veut sortir de la routine',             territoires: ['vivre', 'redecouvrir'],     ambiances: ['spontane', 'creatif'] },
  { id: 'tendresse',   texte: 'On a envie de tendresse',                  territoires: ['desirer', 'retrouver'],     ambiances: ['tendre'] },
  { id: 'desires',     texte: 'On a envie de se sentir désirés',          territoires: ['desirer'],                  ambiances: ['sensuel', 'romantique'] },
  { id: 'redecouvrir', texte: 'On veut se redécouvrir',                   territoires: ['redecouvrir'],              ambiances: ['leger', 'profond'] },
  { id: 'a-dire',      texte: 'On a quelque chose à se dire',             territoires: ['dire'],                     ambiances: ['profond', 'tendre'] },
  { id: 'nouveau',     texte: 'On veut essayer quelque chose de nouveau', territoires: ['vivre', 'desirer'],         ambiances: ['creatif', 'spontane'] }
];

BA.temps = [
  { id: '10',      nom: '10 minutes',     court: '10 min' },
  { id: '30',      nom: '20 à 30 minutes', court: '30 min' },
  { id: '60',      nom: 'Une heure',      court: '1 h' },
  { id: 'soiree',  nom: 'Une soirée',     court: 'Soirée' },
  { id: 'demi',    nom: 'Une demi-journée', court: 'Demi-journée' },
  { id: 'weekend', nom: 'Un week-end',    court: 'Week-end' }
];

BA.lieux = [
  { id: 'maison',     nom: 'À la maison' },
  { id: 'dehors',     nom: 'Dehors' },
  { id: 'restaurant', nom: 'Au restaurant' },
  { id: 'voiture',    nom: 'En voiture' },
  { id: 'distance',   nom: 'À distance' },
  { id: 'partout',    nom: 'N’importe où' }
];

BA.energies = [
  { id: 'fatigues',    nom: 'Très fatigués',  phrase: 'Franchement ? Très peu.' },
  { id: 'tranquilles', nom: 'Tranquilles',    phrase: 'On est posés.' },
  { id: 'disponibles', nom: 'Disponibles',    phrase: 'On a de la marge.' },
  { id: 'motives',     nom: 'Motivés',        phrase: 'On a envie de faire quelque chose.' },
  { id: 'aventureux',  nom: 'Aventureux',     phrase: 'Allez, on y va.' }
];

BA.ambiances = [
  { id: 'leger', nom: 'Léger' }, { id: 'drole', nom: 'Drôle' }, { id: 'romantique', nom: 'Romantique' },
  { id: 'profond', nom: 'Profond' }, { id: 'tendre', nom: 'Tendre' }, { id: 'sensuel', nom: 'Sensuel' },
  { id: 'spontane', nom: 'Spontané' }, { id: 'creatif', nom: 'Créatif' }
];

BA.budgets = [
  { id: 'gratuit', nom: 'Gratuit' }, { id: 'petit', nom: 'Petit budget' }, { id: 'libre', nom: 'Budget libre' }
];

/* Collections éditoriales : une règle de sélection, ou une liste d'identifiants. */
BA.collections = [
  { id: 'semaine-epuisante', nom: 'Après une semaine épuisante', phrase: 'Rien à préparer, rien à réussir. Juste de quoi se retrouver sans effort.', regle: { energies: ['fatigues'] } },
  { id: 'dimanche', nom: 'À faire un dimanche', phrase: 'Le seul jour où personne ne court.', ids: ['comment-tu-vas-toi', 'bande-originale', 'yeux-fermes-cuisine', 'six-photos', 'carte-du-monde', 'portrait-aujourdhui'] },
  { id: 'enfants-dorment', nom: 'Quand les enfants dorment enfin', phrase: 'Il est 21h. La maison est à vous.', regle: { lieux: ['maison'], temps: ['10', '30', '60'] } },
  { id: 'sortir', nom: 'Pour sortir de chez vous', phrase: 'Une veste, des clés, et on verra.', regle: { lieux: ['dehors', 'restaurant'] } },
  { id: 'petits-budgets', nom: 'Petits budgets', phrase: 'Ce qui compte ne coûte presque rien.', regle: { budgets: ['gratuit', 'petit'] } },
  { id: 'vacances', nom: 'À faire en vacances', phrase: 'Du temps devant vous, pour une fois.', regle: { temps: ['demi', 'weekend', 'soiree'] } },
  { id: 'longtemps', nom: 'Pour les couples ensemble depuis longtemps', phrase: 'Quand on croit tout savoir de l’autre.', ids: ['tu-ne-sais-pas-tout', 'deux-inconnus', 'portrait-aujourdhui', 'tu-te-souviens', 'lettre-dans-un-an', 'ce-que-je-veux-dire'] },
  { id: 'rire', nom: 'On a besoin de rire', phrase: 'Pas de grande conversation ce soir.', regle: { ambiances: ['drole'] } },
  { id: 'sans-ecrans', nom: 'Une soirée sans écrans', phrase: 'Les téléphones dans un tiroir, et ce qui reste.', ids: ['on-debranche', 'un-slow-dans-la-cuisine', 'yeux-fermes-cuisine', 'tu-te-souviens', 'une-heure-rien-qua-nous', 'ecoute-moi'] },
  { id: 'anniversaire', nom: 'Pour notre anniversaire', phrase: 'Autre chose qu’un restaurant.', ids: ['rendez-vous-surprise', 'bande-originale', 'tu-te-souviens', 'lettre-dans-un-an', 'nuit-ailleurs', 'deux-inconnus'] },
  { id: 'weekend-nous', nom: 'Un week-end rien que nous', phrase: 'Deux jours sans logistique.', regle: { temps: ['weekend', 'demi'] } }
];

/* ------------------------------------------------------------------ */
/* Les expériences. Les champs `etapes` décrivent ce qui se passe une
   fois qu'on a appuyé sur « Commencer ». Types d'étapes :
   texte, reponse, devine, revelation, conversation, chrono, playlist,
   secret, regles, revelation-secret, souvenir, audio, choix, oui-peut-etre-non.
   L'étape de fin est ajoutée automatiquement par le moteur.             */

BA.experiences = [

  /* ===================== SE RETROUVER ===================== */
  {
    id: 'dix-minutes-pour-se-retrouver', titre: '10 minutes pour se retrouver',
    accroche: 'Vous n’avez rien à dire. Justement.',
    territoire: 'retrouver', temps: '10', lieux: ['maison'], energies: ['fatigues', 'tranquilles'],
    ambiances: ['tendre'], budget: 'gratuit', mecanique: 'Expérience audio', audio: true, decouverte: true,
    ilVousFaut: 'Un canapé, un lit ou le sol. Vos téléphones posés, un seul qui joue l’audio.',
    avant: 'Dix minutes, une voix, aucune question. Vous vous installez l’un contre l’autre et vous laissez faire. Si l’un de vous s’endort, c’est que ça a marché.',
    etapes: [
      { t: 'audio', titre: '10 minutes pour se retrouver', duree: 600,
        reperes: [[0, 'S’installer'], [90, 'Respirer au même rythme'], [240, 'Le poids de la journée'], [420, 'Ce qui reste quand on enlève tout'], [540, 'Revenir doucement']] }
    ]
  },
  {
    id: 'on-debranche', titre: 'On débranche',
    accroche: 'Deux téléphones dans un tiroir. Une soirée pour voir ce qui reste.',
    territoire: 'retrouver', temps: 'soiree', lieux: ['maison'], energies: ['fatigues', 'tranquilles'],
    ambiances: ['leger', 'tendre'], budget: 'gratuit', mecanique: 'Rituel', decouverte: true,
    ilVousFaut: 'Un tiroir qui ferme. Quelque chose à boire. De quoi écrire, si vous en avez envie.',
    avant: 'Pas de programme. L’expérience, c’est l’absence de programme. On vous accompagne pour les vingt premières minutes, le temps que l’envie de vérifier quelque chose passe. Après, vous êtes seuls.',
    etapes: [
      { t: 'texte', titre: 'Le tiroir', corps: 'Mettez vos deux téléphones en silencieux et rangez-les dans le même tiroir. Pas sur la table retournés. Dans le tiroir. Si vous lisez ceci sur l’un d’eux, c’est la dernière chose que vous lisez ce soir.', bouton: 'C’est fait' },
      { t: 'texte', titre: 'Les dix premières minutes', corps: 'Elles sont bizarres. Vous allez chercher vos poches. C’est normal. Préparez quelque chose à boire ensemble, lentement, sans parler d’organisation.', bouton: 'Continuer' },
      { t: 'texte', titre: 'Une seule question', corps: 'Posez-la une fois, chacun y répond : « Qu’est-ce que tu ferais de ta soirée si tu avais quinze ans et pas de téléphone ? » Puis faites-le. Ou quelque chose qui y ressemble.', bouton: 'On y va' }
    ]
  },
  {
    id: 'une-heure-rien-qua-nous', titre: 'Une heure rien qu’à nous',
    accroche: 'Une marche, trois questions, aucune décision à prendre.',
    territoire: 'retrouver', temps: '60', lieux: ['dehors', 'maison'], energies: ['tranquilles', 'disponibles'],
    ambiances: ['tendre', 'profond'], budget: 'gratuit', mecanique: 'Marche guidée',
    ilVousFaut: 'Des chaussures confortables. Un trajet que vous connaissez, pour ne pas avoir à y penser.',
    avant: 'On marche côte à côte, pas face à face. C’est plus facile de dire les choses quand on regarde devant soi. Trois questions, une tous les quarts d’heure. Le reste du temps, rien n’est obligatoire.',
    etapes: [
      { t: 'texte', titre: 'Avant de sortir', corps: 'Une règle : pendant cette heure, aucune décision. Si une question logistique arrive, l’un de vous dit « plus tard » et c’est réglé.', bouton: 'On part' },
      { t: 'conversation', titre: 'Première question', pistes: ['Qu’est-ce qui t’a pris le plus de place dans la tête cette semaine ? Pas ce que tu as fait. Ce qui tournait.'] },
      { t: 'conversation', titre: 'Deuxième question', pistes: ['Un moment, ces derniers jours, où tu as pensé à moi alors que je n’étais pas là ?'] },
      { t: 'conversation', titre: 'Troisième question', pistes: ['De quoi tu aurais besoin, là, cette semaine, et que tu ne m’as pas demandé ?'] },
      { t: 'texte', titre: 'Le retour', corps: 'Rentrez en silence si vous voulez. Ce qui a été dit ne demande pas de réponse ce soir.', bouton: 'Terminer' }
    ]
  },
  {
    id: 'fermez-les-yeux', titre: 'Fermez les yeux',
    accroche: 'Dix minutes allongés, sans rien faire, mais ensemble.',
    territoire: 'retrouver', temps: '10', lieux: ['maison'], energies: ['fatigues'],
    ambiances: ['tendre'], budget: 'gratuit', mecanique: 'Expérience audio', audio: true,
    ilVousFaut: 'Un endroit où s’allonger à deux. La lumière basse.',
    avant: 'Une voix, un rythme de respiration, et la consigne de ne rien faire d’autre que sentir l’autre à côté. Pour les soirs où parler est au-dessus de vos forces.',
    etapes: [
      { t: 'audio', titre: 'Fermez les yeux', duree: 600,
        reperes: [[0, 'S’allonger'], [60, 'Trouver le souffle de l’autre'], [300, 'Une main'], [480, 'Rester encore un peu']] }
    ]
  },
  {
    id: 'sans-parler-des-enfants', titre: 'Sans parler des enfants',
    accroche: 'Une soirée où le mot « école » est interdit.',
    territoire: 'retrouver', temps: 'soiree', lieux: ['partout'], energies: ['fatigues', 'tranquilles', 'disponibles'],
    ambiances: ['leger', 'drole'], budget: 'gratuit', mecanique: 'Chrono et pistes', parents: true, decouverte: true,
    ilVousFaut: 'Les enfants couchés ou gardés. Un téléphone posé entre vous, pour le chrono.',
    avant: 'Vous les aimez. Ce n’est pas la question. La question, c’est : de quoi parliez-vous avant ? Pendant ce temps, tout sujet qui concerne les enfants ou l’organisation de la maison est hors jeu, sauf urgence. Quand l’un dérape, l’autre tire une piste.',
    etapes: [
      { t: 'texte', titre: 'La règle du soir', corps: 'Interdits jusqu’à la fin du chrono : les enfants, l’école, les courses, les factures, les rendez-vous médicaux, la machine à laver. Autorisé : tout le reste. Celui qui dérape tire une piste et doit y répondre.', bouton: 'On lance le chrono' },
      { t: 'chrono', minutes: 45, titre: 'Sans parler des enfants',
        interdits: ['Les enfants', 'L’école', 'Les courses', 'Les factures', 'La maison'],
        pistes: [
          'Si tu avais une soirée seul(e), sans personne à prévenir, tu ferais quoi ?',
          'Un truc que tu avais envie d’apprendre à vingt ans et que tu n’as jamais fait.',
          'Le dernier moment où tu as ri jusqu’à en avoir mal au ventre. Raconte.',
          'Quelle ville tu choisirais pour y vivre six mois, et pourquoi celle-là ?',
          'Un avis que tu as changé ces deux dernières années.',
          'La chose la plus idiote que tu as achetée avec plaisir.',
          'Si on partait demain matin pour trois jours, tu mets quoi dans le sac ?',
          'Une personne que tu admires en ce moment, et que je ne connais pas.',
          'Qu’est-ce qui te rend fier(e) cette année, en dehors de la famille ?',
          'Une chanson que tu n’oses pas aimer devant les gens.'
        ] },
      { t: 'texte', titre: 'Le chrono est fini', corps: 'Vous pouvez reparler de tout. Mais si vous n’en avez pas envie tout de suite, c’est bon signe.', bouton: 'Terminer' }
    ]
  },
  {
    id: 'comment-tu-vas-toi', titre: 'Comment tu vas, toi ?',
    accroche: 'Le point de la semaine, sans parler de la semaine.',
    territoire: 'retrouver', temps: '30', lieux: ['maison', 'dehors'], energies: ['fatigues', 'tranquilles'],
    ambiances: ['profond', 'tendre'], budget: 'gratuit', mecanique: 'Conversation guidée', decouverte: true,
    ilVousFaut: 'Trente minutes et un endroit où personne ne vous coupera.',
    avant: 'Vous savez tout de l’agenda de l’autre. Vous ne savez pas forcément comment il va. Trois temps, à tour de rôle, et l’autre écoute jusqu’au bout avant de parler.',
    etapes: [
      { t: 'conversation', titre: 'Premier temps', pistes: ['Comment tu vas, toi ? Pas « ça va ». Comment tu vas, vraiment, en ce moment.'] },
      { t: 'conversation', titre: 'Deuxième temps', pistes: ['Qu’est-ce qui t’a fatigué(e) cette semaine, et qui n’a rien à voir avec la liste des choses à faire ?'] },
      { t: 'conversation', titre: 'Troisième temps', pistes: ['Qu’est-ce qui te ferait du bien la semaine prochaine ? Une chose. Je retiens.'] }
    ]
  },

  /* ===================== SE REDÉCOUVRIR ===================== */
  {
    id: 'tu-ne-sais-pas-tout', titre: 'Tu ne sais pas tout de moi',
    accroche: 'Vous croyez vous connaître par cœur. On vérifie.',
    territoire: 'redecouvrir', temps: '30', lieux: ['maison', 'partout'], energies: ['fatigues', 'tranquilles', 'disponibles'],
    ambiances: ['leger', 'profond'], budget: 'gratuit', mecanique: 'Deviner, puis révéler', decouverte: true,
    ilVousFaut: 'Un seul téléphone, qu’on se passe. Et la promesse de ne pas regarder quand ce n’est pas son tour.',
    avant: 'Chacun répond à six questions de son côté. Puis chacun devine ce que l’autre a répondu. On révèle. Il n’y a rien à gagner. Le but, c’est la phrase « Sérieusement ? Je ne savais pas ça. »',
    etapes: [
      { t: 'reponse', qui: 'A', secret: true, questions: [
        { id: 'q1', q: 'Si tu pouvais changer de métier demain, sans aucune contrainte, tu ferais quoi ?' },
        { id: 'q2', q: 'Le compliment qui te touche le plus, celui qu’on ne te fait pas assez.' },
        { id: 'q3', q: 'Une chose que tu as envie d’apprendre cette année.' },
        { id: 'q4', q: 'Ton moment préféré d’une journée ordinaire.' },
        { id: 'q5', q: 'La chose qui t’inquiète le plus en ce moment, en dehors de nous.' },
        { id: 'q6', q: 'Un endroit où tu rêves de m’emmener.' }
      ] },
      { t: 'reponse', qui: 'B', secret: true, memeQuestions: true },
      { t: 'devine', qui: 'A', cible: 'B', questions: ['q1', 'q3', 'q6'] },
      { t: 'devine', qui: 'B', cible: 'A', questions: ['q2', 'q4', 'q5'] },
      { t: 'revelation', questions: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] },
      { t: 'conversation', titre: 'Ce qui vous a surpris', pistes: [
        'Reprenez la réponse qui vous a le plus étonnés. Celui qui l’a écrite raconte d’où elle vient.',
        'Y a-t-il une réponse qui a changé depuis l’année dernière ? Depuis vos débuts ?',
        'Une question que vous aimeriez ajouter à cette liste, pour la prochaine fois.'
      ] }
    ]
  },
  {
    id: 'deux-inconnus', titre: 'Deux inconnus',
    accroche: 'Vous arrivez séparément. Vous venez de vous rencontrer.',
    territoire: 'redecouvrir', temps: 'soiree', lieux: ['restaurant', 'dehors'], energies: ['disponibles', 'motives'],
    ambiances: ['spontane', 'romantique'], budget: 'libre', mecanique: 'Jeu de rôle', decouverte: true,
    ilVousFaut: 'Un lieu choisi ensemble. Deux trajets différents si vous pouvez. Un téléphone dans une poche, pour les questions.',
    avant: 'Pendant les trente premières minutes, vous ne vous connaissez pas. Interdit : les enfants, la maison, le travail logistique, tout ce qui suppose un passé commun. La plateforme vous souffle des questions, une par une, comme à un premier rendez-vous. Le but, c’est de retrouver la curiosité qu’on a pour quelqu’un qu’on n’a pas encore classé.',
    etapes: [
      { t: 'texte', titre: 'Avant de partir', corps: 'Mettez-vous d’accord sur le lieu et l’heure, puis arrêtez de vous parler jusqu’à y être. Si vous partez de la même maison, l’un part dix minutes avant l’autre. Habillez-vous comme pour quelqu’un que vous voulez impressionner.', bouton: 'On se retrouve là-bas' },
      { t: 'texte', titre: 'Vous êtes assis', corps: 'Vous ne vous connaissez pas. Présentez-vous. Prénom, ce que vous faites dans la vie, ce qui vous amène ici ce soir. Prenez le temps de la gêne, elle fait partie du jeu.', bouton: 'Lancer les trente minutes' },
      { t: 'chrono', minutes: 30, titre: 'Deux inconnus',
        interdits: ['Les enfants', 'La maison', 'Le travail logistique', '« Tu te souviens »'],
        pistes: [
          'Qu’est-ce qui vous a donné envie de dire oui à ce rendez-vous ?',
          'Vous faites quoi de vos dimanches, quand personne ne décide pour vous ?',
          'Un endroit dans le monde où vous vous êtes senti(e) exactement à votre place.',
          'Qu’est-ce que les gens comprennent de travers chez vous, au premier regard ?',
          'Quel genre de personne vous ne pourriez pas aimer longtemps ?',
          'Une chose que vous avez faite cette année et dont vous êtes fier(e).',
          'Qu’est-ce que vous cherchez, en ce moment, dans la vie ? Pas en amour. Dans la vie.',
          'Si je vous invitais une deuxième fois, vous préféreriez quoi ?'
        ] },
      { t: 'texte', titre: 'Le chrono est fini', corps: 'Vous pouvez redevenir vous. Ou pas tout de suite. Commandez autre chose. Regardez la personne en face comme si vous veniez de la rencontrer, parce que, sur certains points, c’est le cas.', bouton: 'Terminer' }
    ]
  },
  {
    id: 'fais-moi-decouvrir-ton-monde', titre: 'Fais-moi découvrir ton monde',
    accroche: 'Une soirée dans ce que l’autre aime. Sans juger, sans devoir aimer.',
    territoire: 'redecouvrir', temps: 'soiree', lieux: ['maison', 'dehors'], energies: ['disponibles', 'motives'],
    ambiances: ['creatif', 'leger'], budget: 'petit', mecanique: 'À tour de rôle, une semaine sur deux', decouverte: true,
    ilVousFaut: 'Une soirée. Ce que l’hôte voudra montrer. L’invité n’a rien à préparer.',
    avant: 'L’un de vous est l’hôte. Il choisit une chose qu’il aime vraiment : une musique, un film, un plat, un sport, un artiste, un sujet qui l’obsède. L’autre entre dedans, pose des questions, essaie. La semaine suivante, on inverse. Ce n’est pas un test de goût. C’est une visite guidée.',
    etapes: [
      { t: 'choix', cle: 'hote', titre: 'Qui est l’hôte ce soir ?', question: 'L’autre sera l’hôte la semaine prochaine.', options: ['A', 'B'] },
      { t: 'choix', cle: 'domaine', titre: 'Dans quel monde on entre ?', question: 'L’hôte choisit. Quelque chose qu’il aime vraiment, même si l’autre a déjà levé les yeux au ciel dessus.', options: ['Une musique', 'Un film ou une série', 'Un plat', 'Un sport ou un jeu', 'Un artiste', 'Un livre', 'Un lieu', 'Un sujet qui m’obsède'] },
      { t: 'texte', titre: 'Les règles de l’invité', corps: 'Tu ne commentes pas avant la fin. Tu poses au moins trois questions qui commencent par « pourquoi ». Tu n’as pas à aimer. Tu as à comprendre ce que ça fait à l’autre.', bouton: 'Compris' },
      { t: 'texte', titre: 'Les règles de l’hôte', corps: 'Tu ne t’excuses pas de ce que tu aimes. Tu racontes quand ça a commencé, avec qui, et ce que ça te fait encore aujourd’hui. Tu montres, tu fais écouter, tu fais goûter.', bouton: 'La visite commence' },
      { t: 'conversation', titre: 'Pendant la visite', pistes: [
        'Hôte : raconte la première fois que ça t’a plu. Tu avais quel âge, tu étais où ?',
        'Invité : qu’est-ce que tu ne comprenais pas, avant ce soir, dans ce goût-là ?',
        'Hôte : qu’est-ce que ça dit de toi, que je ne sais peut-être pas ?',
        'Invité : une chose que tu as aimée ce soir, même petite, même de travers.'
      ] },
      { t: 'texte', titre: 'La semaine prochaine', corps: 'On inverse. L’invité devient l’hôte. Mettez la date maintenant, sinon ça n’arrivera pas.', bouton: 'Terminer' }
    ]
  },
  {
    id: 'la-question-quon-ne-se-pose-jamais', titre: 'La question qu’on ne se pose jamais',
    accroche: 'Une seule question. Tirée au sort. Dix minutes.',
    territoire: 'redecouvrir', temps: '10', lieux: ['partout'], energies: ['fatigues', 'tranquilles'],
    ambiances: ['profond', 'leger'], budget: 'gratuit', mecanique: 'Tirage au sort', decouverte: true,
    ilVousFaut: 'Rien. Ça marche dans la voiture, au lit, dans une file d’attente.',
    avant: 'La plateforme tire une question que vous ne vous êtes probablement jamais posée. Chacun y répond, l’un après l’autre. Pas de bonne réponse. Si l’un de vous dit « je ne sais pas », l’autre a le droit de demander « et si tu savais ? ».',
    etapes: [
      { t: 'tirage', titre: 'Votre question', pistes: [
        'Quel âge tu as, dans ta tête, la plupart du temps ?',
        'Qu’est-ce que tu ferais si tu étais sûr(e) de ne pas être jugé(e) ?',
        'Quelle version de toi me manque, à ton avis ?',
        'Si on devait recommencer de zéro, qu’est-ce que tu garderais de nous en premier ?',
        'De quoi tu as eu peur cette semaine, sans le dire ?',
        'Qu’est-ce que tu as abandonné en devenant adulte, et que tu aimerais reprendre ?',
        'Quel est le moment de notre histoire que tu raconterais à quelqu’un qui ne nous connaît pas ?',
        'Qu’est-ce que tu aimerais que je comprenne sans que tu aies à l’expliquer ?',
        'À quoi tu penses quand tu n’arrives pas à dormir ?',
        'Si tu pouvais me donner une qualité que tu as et que je n’ai pas, laquelle ?'
      ] }
    ]
  },
  {
    id: 'choisis-pour-moi', titre: 'Choisis pour moi',
    accroche: 'Ce soir, c’est l’autre qui commande. Pour vous.',
    territoire: 'redecouvrir', temps: '30', lieux: ['restaurant', 'dehors', 'maison'], energies: ['disponibles'],
    ambiances: ['drole', 'leger'], budget: 'petit', mecanique: 'Jeu',
    ilVousFaut: 'Un menu, une carte de boissons, ou un catalogue de films. N’importe quoi avec des choix dedans.',
    avant: 'Vous croyez savoir ce que l’autre aime. On vérifie à l’envers : chacun choisit pour l’autre, sans lui demander. Le plat, la boisson, le film, le dessert. L’autre ne peut pas refuser. Ensuite on compare avec ce qu’il aurait pris.',
    etapes: [
      { t: 'texte', titre: 'Le premier choix', corps: 'Chacun choisit, en secret, ce que l’autre va manger ou boire. Pas ce qu’il prend d’habitude. Ce que vous pensez qu’il aimerait s’il osait.', bouton: 'Les choix sont faits' },
      { t: 'conversation', titre: 'Après le premier choix', pistes: ['Tu aurais pris quoi, toi ? Et le choix de l’autre, il tombe à côté ou il voit quelque chose que tu ne vois pas ?'] },
      { t: 'texte', titre: 'Le deuxième choix', corps: 'On monte d’un cran : chacun choisit pour l’autre la prochaine sortie, le prochain film, ou le prochain week-end. Vous l’inscrivez dans vos envies en sortant d’ici.', bouton: 'Terminer' }
    ]
  },
  {
    id: 'portrait-aujourdhui', titre: 'Qui tu deviens',
    accroche: 'Cinq choses chez l’autre qui n’existaient pas il y a trois ans.',
    territoire: 'redecouvrir', temps: '30', lieux: ['maison'], energies: ['tranquilles'],
    ambiances: ['creatif', 'profond'], budget: 'gratuit', mecanique: 'Écriture séparée, puis lecture',
    ilVousFaut: 'Deux feuilles, deux stylos, ou le téléphone à tour de rôle.',
    avant: 'On aime la personne qu’on a rencontrée. On oublie de regarder celle qu’elle est en train de devenir. Chacun écrit de son côté, puis lit à l’autre.',
    etapes: [
      { t: 'reponse', qui: 'A', secret: true, questions: [
        { id: 'p1', q: 'Une chose que tu fais aujourd’hui et que tu ne faisais pas quand on s’est connus.' },
        { id: 'p2', q: 'Une chose dont tu as peur aujourd’hui, et pas avant.' },
        { id: 'p3', q: 'Un endroit où tu te sens bien maintenant, et qui n’existait pas pour toi avant.' }
      ] },
      { t: 'reponse', qui: 'B', secret: true, memeQuestions: true },
      { t: 'revelation', questions: ['p1', 'p2', 'p3'], sansDevine: true },
      { t: 'conversation', titre: 'Lecture', pistes: ['Chacun lit ce qu’il a écrit sur lui-même. L’autre dit ce qu’il avait vu, et ce qu’il n’avait pas vu.'] }
    ]
  },

  /* ===================== SE DIRE ===================== */
  {
    id: 'ce-que-je-nose-pas-te-demander', titre: 'Ce que je n’ose pas te demander',
    accroche: 'Chacun écrit une demande. On lit les règles. Puis on révèle.',
    territoire: 'dire', temps: '30', lieux: ['maison'], energies: ['tranquilles', 'disponibles'],
    ambiances: ['profond', 'tendre'], budget: 'gratuit', mecanique: 'Écriture secrète, puis révélation', decouverte: true,
    ilVousFaut: 'Un téléphone qu’on se passe. Du temps après, pour ne pas enchaîner sur autre chose.',
    avant: 'Il y a une chose que vous aimeriez demander à l’autre et que vous gardez. Par pudeur, par peur de la réponse, parce que ce n’est jamais le moment. Ici, c’est le moment. Chacun écrit une demande. Avant de la lire, on relit cinq règles. Elles protègent les deux.',
    etapes: [
      { t: 'secret', qui: 'A', consigne: 'Écris une chose que tu aimerais demander à l’autre et que tu n’as pas osé demander. Une seule. La formuler comme une envie, pas comme un reproche.' },
      { t: 'secret', qui: 'B', consigne: 'Écris une chose que tu aimerais demander à l’autre et que tu n’as pas osé demander. Une seule. La formuler comme une envie, pas comme un reproche.' },
      { t: 'regles', titre: 'Avant de lire', regles: [
        'On écoute jusqu’au bout.',
        'On ne se moque pas, même gentiment.',
        'Demander, ce n’est pas exiger.',
        'On a le droit de répondre plus tard.',
        'On a le droit de dire non.'
      ] },
      { t: 'revelation-secret' },
      { t: 'conversation', titre: 'Après la lecture', pistes: [
        'Celui qui a lu : qu’est-ce que ça te fait d’avoir entendu ça ? Pas ce que tu en penses. Ce que ça te fait.',
        'Celui qui a écrit : depuis combien de temps tu portais cette demande ?',
        'Qu’est-ce qui rendait la demande difficile à faire ? La demande, ou la peur de la réponse ?'
      ] }
    ]
  },
  {
    id: 'jai-quelque-chose-a-te-demander', titre: 'J’ai quelque chose à te demander',
    accroche: 'Une demande, bien formulée, en vingt minutes.',
    territoire: 'dire', temps: '30', lieux: ['maison', 'partout'], energies: ['fatigues', 'tranquilles'],
    ambiances: ['tendre'], budget: 'gratuit', mecanique: 'Cadre de parole',
    ilVousFaut: 'Un endroit calme. Pas le moment où l’autre est en train de partir.',
    avant: 'La plupart des demandes dans un couple arrivent de travers : au mauvais moment, sous forme de reproche, ou tellement enrobées qu’on ne les entend pas. Ici on en fait une, une seule, en trois temps. L’autre écoute, puis répond dans le cadre.',
    etapes: [
      { t: 'texte', titre: 'Qui demande ce soir ?', corps: 'Un seul des deux. L’autre aura son tour une autre fois. Décidez-le maintenant.', bouton: 'C’est décidé' },
      { t: 'conversation', titre: 'Temps un : la situation', pistes: ['Décris une situation précise, récente, sans « toujours » ni « jamais ». Un jour, une heure, une scène.'] },
      { t: 'conversation', titre: 'Temps deux : ce que ça te fait', pistes: ['Dis ce que ça te fait, à toi. Pas ce que l’autre a fait de mal. « Dans cette scène, moi, je me sens... »'] },
      { t: 'conversation', titre: 'Temps trois : la demande', pistes: ['Formule ce que tu aimerais, concrètement, la prochaine fois. Une chose faisable, pas un changement de personnalité.'] },
      { t: 'conversation', titre: 'La réponse', pistes: ['Celui qui écoute reformule d’abord ce qu’il a compris. Puis il dit ce qu’il peut faire, ce qu’il ne peut pas, et ce dont il a besoin pour y arriver.'] }
    ]
  },
  {
    id: 'ce-que-jaime-chez-toi-aujourdhui', titre: 'Ce que j’aime chez toi aujourd’hui',
    accroche: 'Trois choses précises, vues cette semaine. Pas des généralités.',
    territoire: 'dire', temps: '10', lieux: ['partout'], energies: ['fatigues'],
    ambiances: ['tendre', 'leger'], budget: 'gratuit', mecanique: 'À tour de rôle', decouverte: true,
    ilVousFaut: 'Rien. Le lit, la voiture, un message vocal si vous êtes loin.',
    avant: '« Je t’aime » s’use. « J’ai aimé la façon dont tu as parlé à ta mère mardi » ne s’use pas. Chacun donne trois choses, vues cette semaine, qu’il a aimées chez l’autre. Précises. Datées si possible.',
    etapes: [
      { t: 'conversation', titre: 'Premier tour', pistes: ['Une chose que tu as faite cette semaine et que j’ai aimée. Le jour, la scène.'] },
      { t: 'conversation', titre: 'Deuxième tour', pistes: ['Une chose de toi que j’ai regardée cette semaine, sans te le dire.'] },
      { t: 'conversation', titre: 'Troisième tour', pistes: ['Une chose que tu es, et que je ne te dis pas assez.'] }
    ]
  },
  {
    id: 'ce-que-je-veux-dire', titre: 'Ce que je veux dire quand je fais ça',
    accroche: 'Vous vous envoyez des signaux. Vous ne lisez pas le même code.',
    territoire: 'dire', temps: '30', lieux: ['maison'], energies: ['tranquilles', 'disponibles'],
    ambiances: ['profond', 'leger'], budget: 'gratuit', mecanique: 'Décodage à deux',
    ilVousFaut: 'Trente minutes et un peu d’humour sur vous-mêmes.',
    avant: 'Elle vient se coller sur le canapé : pour elle, « viens vers moi ». Pour lui, rien de spécial. Il propose « on sort manger ? » : derrière, il y a « tu me manques ». Elle entend « j’ai la flemme de cuisiner ». On se rate, sans mauvaise volonté. Ce soir, on traduit.',
    etapes: [
      { t: 'reponse', qui: 'A', secret: true, questions: [
        { id: 's1', q: 'Un geste que tu fais quand tu as envie que l’autre vienne vers toi.' },
        { id: 's2', q: 'Une phrase que tu dis quand, en vrai, tu veux dire « tu me manques ».' },
        { id: 's3', q: 'Ce que tu fais quand tu as besoin qu’on te laisse tranquille, sans le dire.' }
      ] },
      { t: 'reponse', qui: 'B', secret: true, memeQuestions: true },
      { t: 'devine', qui: 'A', cible: 'B', questions: ['s1', 's2', 's3'] },
      { t: 'devine', qui: 'B', cible: 'A', questions: ['s1', 's2', 's3'] },
      { t: 'revelation', questions: ['s1', 's2', 's3'] },
      { t: 'conversation', titre: 'Le code', pistes: ['Reprenez un signal que l’autre n’avait pas décodé. Racontez une fois où ça s’est raté. Riez-en si vous pouvez, c’est permis.'] }
    ]
  },
  {
    id: 'le-desaccord-tranquille', titre: 'Le désaccord tranquille',
    accroche: 'Un sujet où vous n’êtes pas d’accord. Et aucune envie de gagner.',
    territoire: 'dire', temps: '30', lieux: ['maison'], energies: ['disponibles'],
    ambiances: ['profond'], budget: 'gratuit', mecanique: 'Cadre de parole',
    ilVousFaut: 'Un sujet qui ne soit pas la dispute en cours. Un vieux désaccord, pas une plaie ouverte.',
    avant: 'Il y a des sujets sur lesquels vous ne tombez jamais d’accord, alors vous les évitez. Ce soir, on en prend un, et on change le but : personne n’a raison à la fin. Chacun doit pouvoir redire la position de l’autre sans la caricaturer.',
    etapes: [
      { t: 'texte', titre: 'Choisir le sujet', corps: 'Pas celui qui fait mal en ce moment. Un désaccord ancien, presque confortable : l’argent de poche, les vacances chez les parents, l’heure du coucher, la voiture.', bouton: 'On a le sujet' },
      { t: 'conversation', titre: 'Premier tour', pistes: ['Le premier expose sa position en deux minutes. Le second ne répond pas : il reformule, jusqu’à ce que le premier dise « oui, c’est ça ».'] },
      { t: 'conversation', titre: 'Deuxième tour', pistes: ['On inverse. Même règle : reformuler jusqu’au « oui, c’est ça ».'] },
      { t: 'conversation', titre: 'Le point commun', pistes: ['Qu’est-ce que vous voulez tous les deux, derrière vos deux positions ? Il y a presque toujours quelque chose.'] }
    ]
  },
  {
    id: 'lettre-dans-un-an', titre: 'La lettre à ouvrir dans un an',
    accroche: 'Chacun écrit à l’autre. On la scelle. Rendez-vous dans douze mois.',
    territoire: 'dire', temps: '30', lieux: ['maison'], energies: ['tranquilles'],
    ambiances: ['creatif', 'profond', 'romantique'], budget: 'gratuit', mecanique: 'Écriture, scellée dans vos souvenirs',
    ilVousFaut: 'Trente minutes chacun de son côté, puis deux minutes ensemble.',
    avant: 'On écrit rarement à la personne avec qui on vit. Ce soir, chacun écrit une lettre à l’autre, qu’il ne lira que dans un an. Elle est scellée dans votre espace. Le jour venu, vous les ouvrez ensemble.',
    etapes: [
      { t: 'texte', titre: 'Ce qu’on met dedans', corps: 'Où vous en êtes aujourd’hui. Ce que vous espérez pour l’autre dans un an. Une chose que vous ne dites pas assez. Une prédiction, pour rire. Pas de mode d’emploi, écrivez comme ça vient.', bouton: 'Je commence' },
      { t: 'secret', qui: 'A', consigne: 'Ta lettre à l’autre, à ouvrir dans un an.', long: true },
      { t: 'secret', qui: 'B', consigne: 'Ta lettre à l’autre, à ouvrir dans un an.', long: true },
      { t: 'sceller', titre: 'Les lettres sont scellées', corps: 'Elles sont rangées dans vos souvenirs, fermées. La date d’ouverture est notée. D’ici là, personne ne triche.' }
    ]
  },

  /* ===================== SE DÉSIRER ===================== */
  {
    id: 'un-moment-de-tendresse', titre: 'Un moment de tendresse',
    accroche: 'Vingt minutes, une voix, et la main de l’autre.',
    territoire: 'desirer', temps: '30', lieux: ['maison'], energies: ['fatigues', 'tranquilles'],
    ambiances: ['tendre'], budget: 'gratuit', mecanique: 'Expérience audio', audio: true,
    ilVousFaut: 'Le lit ou le canapé. La lumière basse. Rien d’autre.',
    avant: 'Ce n’est pas une expérience sexuelle. C’est une expérience de contact : une voix vous guide, lentement, vers une présence physique simple. Chacun peut arrêter, modifier ou passer une consigne, à tout moment, sans l’expliquer.',
    etapes: [
      { t: 'audio', titre: 'Un moment de tendresse', duree: 1200, intime: true,
        reperes: [[0, 'S’installer face à face'], [120, 'Les mains'], [420, 'Le visage'], [780, 'S’appuyer l’un sur l’autre'], [1080, 'Rester']] }
    ]
  },
  {
    id: 'rendez-vous-surprise', titre: 'Le rendez-vous surprise',
    accroche: 'L’un prépare tout. L’autre ne sait que l’heure et la tenue.',
    territoire: 'desirer', temps: 'soiree', lieux: ['dehors', 'restaurant'], energies: ['motives'],
    ambiances: ['romantique', 'spontane'], budget: 'libre', mecanique: 'Préparé par l’un, vécu par l’autre',
    ilVousFaut: 'Une date dans la semaine. Un budget convenu à l’avance, pour que la surprise ne soit pas une inquiétude.',
    avant: 'Un de vous organise. L’autre reçoit, trois jours avant, un seul message : l’heure, et comment s’habiller. Il ne pose aucune question. Le soir venu, il se laisse emmener. La plateforme aide l’organisateur à préparer, et l’invité à ne rien savoir.',
    etapes: [
      { t: 'choix', cle: 'organisateur', titre: 'Qui organise ?', question: 'L’autre quitte cet écran maintenant.', options: ['A', 'B'] },
      { t: 'texte', titre: 'Pour l’organisateur', corps: 'Choisis une chose que l’autre n’a jamais faite avec toi, ou plus depuis longtemps. Pas forcément cher. Un lieu où il n’a jamais mis les pieds compte double. Prévois le trajet, la réservation s’il en faut, et un plan B si la pluie s’invite.', bouton: 'J’ai une idée' },
      { t: 'texte', titre: 'Le message à envoyer', corps: 'Trois jours avant, envoie exactement ceci, et rien d’autre : « Samedi, 19h. Tenue : comme pour quelqu’un que tu veux impressionner. » Puis ne réponds à aucune question.', bouton: 'Envoyé' },
      { t: 'texte', titre: 'Le soir', corps: 'Invité : tu ne devines pas à voix haute. Organisateur : tu ne t’excuses de rien, même si la table n’est pas celle que tu voulais. Ce qui compte, c’est d’avoir été choisi.', bouton: 'Terminer' }
    ]
  },
  {
    id: 'ecoute-moi', titre: 'Écoute-moi',
    accroche: 'Une voix guide le toucher. Chacun peut passer une consigne.',
    territoire: 'desirer', temps: '30', lieux: ['maison'], energies: ['tranquilles', 'disponibles'],
    ambiances: ['sensuel', 'tendre'], budget: 'gratuit', mecanique: 'Expérience audio', audio: true, intime: true,
    ilVousFaut: 'Une porte fermée. La lumière basse. Une huile ou une crème si vous aimez. Vingt minutes où personne ne vous appelle.',
    avant: 'Une expérience intime. Elle ne mène nulle part en particulier : ce qui se passe après vous appartient. La voix propose, à tour de rôle, un toucher simple, lent, et demande à chaque fois si c’est bon. À tout moment, l’un de vous peut dire « on passe » ou « on arrête ». Sans justification.',
    etapes: [
      { t: 'audio', titre: 'Écoute-moi', duree: 1200, intime: true,
        reperes: [[0, 'Se mettre d’accord'], [150, 'Les mains de l’un'], [540, 'On inverse'], [930, 'Ensemble'], [1110, 'Ce que vous voulez en faire']] }
    ]
  },
  {
    id: 'ce-que-jai-regarde-chez-toi', titre: 'Ce que j’ai regardé chez toi aujourd’hui',
    accroche: 'Trois détails physiques, vus aujourd’hui. Dits à voix haute.',
    territoire: 'desirer', temps: '10', lieux: ['partout'], energies: ['fatigues', 'tranquilles'],
    ambiances: ['sensuel', 'leger'], budget: 'gratuit', mecanique: 'À tour de rôle', decouverte: true,
    ilVousFaut: 'Rien. Ça marche au lit, en voiture, par message vocal.',
    avant: 'On regarde l’autre toute la journée sans le voir. Ce soir, chacun dit trois choses qu’il a regardées chez l’autre aujourd’hui. Le corps, un geste, une façon de se tenir. Précis, sans commentaire. L’autre reçoit, et ne répond rien d’autre que « merci ».',
    etapes: [
      { t: 'conversation', titre: 'Le premier regard', pistes: ['Un détail de ton corps que j’ai regardé aujourd’hui, et à quel moment.'] },
      { t: 'conversation', titre: 'Le deuxième', pistes: ['Un geste que tu as fait, qui m’a plu, et que tu ne sais pas que tu fais.'] },
      { t: 'conversation', titre: 'Le troisième', pistes: ['Quelque chose chez toi que j’aimerais regarder plus longtemps.'] }
    ]
  },
  {
    id: 'et-si-on-disait-oui', titre: 'Et si on disait oui ?',
    accroche: 'Chacun trie des envies en oui, peut-être, non. Seuls les oui communs apparaissent.',
    territoire: 'desirer', temps: '30', lieux: ['maison'], energies: ['disponibles'],
    ambiances: ['sensuel', 'drole'], budget: 'gratuit', mecanique: 'Tri secret, révélation des accords', intime: true,
    ilVousFaut: 'Un téléphone qu’on se passe, une porte fermée, et de l’humour.',
    avant: 'Une liste d’envies, douces ou moins douces. Chacun la trie de son côté : oui, peut-être, non. Puis la plateforme ne montre que ce que vous avez tous les deux coché « oui ». Les « non » de l’un ne sont jamais révélés à l’autre. C’est le principe : on ne découvre que ce qui est déjà d’accord.',
    etapes: [
      { t: 'oui-peut-etre-non', qui: 'A', propositions: [
        'Un massage de dix minutes, sans suite obligatoire', 'Dormir sans rien, une nuit', 'Un bain ou une douche à deux', 'Danser collés dans le salon, lumière éteinte',
        'Se dire ce qu’on aime, précisément, pendant', 'Une nuit ailleurs, rien que nous', 'Se déshabiller l’un l’autre, lentement', 'S’écrire un message qu’on n’oserait pas dire',
        'Essayer quelque chose qu’on n’a jamais fait', 'Un réveil en retard, exprès', 'Regarder l’autre se préparer, sans l’aider', 'Un rendez-vous où on se retrouve à l’hôtel'
      ] },
      { t: 'oui-peut-etre-non', qui: 'B', memesPropositions: true },
      { t: 'revelation-oui' },
      { t: 'conversation', titre: 'Et maintenant', pistes: ['Choisissez un « oui » commun. Mettez-lui une date. Le reste n’a pas besoin d’être discuté ce soir.'] }
    ]
  },
  {
    id: 'un-slow-dans-la-cuisine', titre: 'Un slow dans la cuisine',
    accroche: 'Une chanson chacun. Lumière éteinte. Personne ne regarde.',
    territoire: 'desirer', temps: '10', lieux: ['maison'], energies: ['fatigues', 'tranquilles', 'disponibles'],
    ambiances: ['tendre', 'spontane', 'romantique'], budget: 'gratuit', mecanique: 'Deux chansons',
    ilVousFaut: 'Une enceinte ou un téléphone. Deux chansons choisies en secret. La vaisselle peut attendre.',
    avant: 'Vous ne dansez plus. Vous dansiez. Chacun choisit une chanson sans la dire. On éteint la lumière de la cuisine, on lance la première, on danse. Mal, bien, ça n’a aucune importance. Puis la deuxième.',
    etapes: [
      { t: 'texte', titre: 'Les deux chansons', corps: 'Chacun choisit, en secret, une chanson sur laquelle il a envie de danser avec l’autre. Pas forcément un slow. Celle qui vous vient.', bouton: 'On a nos chansons' },
      { t: 'texte', titre: 'Première chanson', corps: 'Lumière éteinte. Le premier lance la sienne. On danse jusqu’au bout, sans parler, sans rire de soi.', bouton: 'Deuxième chanson' },
      { t: 'texte', titre: 'Deuxième chanson', corps: 'L’autre lance la sienne. Même règle. Si vous avez envie d’en mettre une troisième, c’est que l’expérience est réussie.', bouton: 'Terminer' }
    ]
  },

  /* ===================== VIVRE ===================== */
  {
    id: 'bande-originale', titre: 'Notre bande originale',
    accroche: 'Huit moments de votre histoire. Une chanson pour chacun.',
    territoire: 'vivre', temps: '60', lieux: ['maison', 'voiture'], energies: ['tranquilles', 'disponibles'],
    ambiances: ['creatif', 'romantique'], budget: 'gratuit', mecanique: 'Construire une playlist', decouverte: true,
    ilVousFaut: 'Une enceinte, et votre application de musique sous la main pour vérifier les titres.',
    avant: 'Chaque couple a des chansons qui portent des moments. On les cherche rarement toutes en même temps. Ce soir, on les met bout à bout : huit moments, huit chansons. Vous les choisissez ensemble, vous les écoutez au fur et à mesure, et à la fin, votre bande originale est prête.',
    etapes: [
      { t: 'playlist', moments: [
        'Notre rencontre', 'Nos débuts', 'Un voyage', 'Une période difficile', 'Un grand souvenir', 'Aujourd’hui',
        'La chanson que j’associe à toi', 'Ce que j’aimerais vivre avec toi maintenant'
      ] }
    ]
  },
  {
    id: 'tu-te-souviens', titre: 'Tu te souviens ?',
    accroche: 'Six portes dans votre mémoire commune. Certaines ont la poignée dure.',
    territoire: 'vivre', temps: '30', lieux: ['maison', 'voiture', 'partout'], energies: ['fatigues', 'tranquilles'],
    ambiances: ['tendre', 'drole'], budget: 'gratuit', mecanique: 'Souvenirs à deux, coffre', decouverte: true,
    ilVousFaut: 'Rien. Vos photos à portée de main, si vous voulez en garder une.',
    avant: 'Vous avez une histoire que personne d’autre ne connaît en entier. Six pistes, à tour de rôle. Chaque fois que l’un raconte, l’autre complète ce qui manque. Et si un souvenir mérite d’être gardé, vous le rangez dans votre coffre.',
    etapes: [
      { t: 'souvenir', pistes: [
        'Notre premier fou rire. C’était où, et qu’est-ce qui était si drôle ?',
        'Un moment où tu m’as impressionné(e).',
        'Une période où on était particulièrement complices. Qu’est-ce qu’on faisait, à l’époque ?',
        'Une catastrophe qui nous fait rire maintenant.',
        'Un endroit que j’aimerais revisiter avec toi.',
        'Un souvenir que je pensais avoir oublié, et qui vient de remonter.'
      ] }
    ]
  },
  {
    id: 'ce-soir-on-sort', titre: 'Ce soir, on sort',
    accroche: 'La plateforme tire la sortie et une contrainte. Vous n’avez plus qu’à y aller.',
    territoire: 'vivre', temps: 'soiree', lieux: ['dehors'], energies: ['motives', 'aventureux'],
    ambiances: ['spontane', 'drole'], budget: 'petit', mecanique: 'Tirage au sort',
    ilVousFaut: 'Une veste, des clés, un petit budget convenu.',
    avant: 'Le problème des sorties, c’est de décider. Alors on ne décide pas. On tire une sortie, puis une contrainte qui change tout. Vous pouvez relancer une fois. Pas deux.',
    etapes: [
      { t: 'tirage', titre: 'Votre sortie', pistes: [
        'Un endroit où vous n’êtes jamais entrés, à moins de quinze minutes de chez vous.',
        'Le bar ou le maquis le plus proche d’un lieu de votre rencontre.',
        'Un quartier de la ville où vous n’allez jamais. Marcher, et s’arrêter où ça sent bon.',
        'Un dîner en deux lieux : l’entrée quelque part, le plat ailleurs.',
        'Un spectacle, un match, un concert, le premier qui a encore des places ce soir.',
        'Un trajet en transport que vous ne prenez jamais, jusqu’au terminus, et un verre là-bas.'
      ] },
      { t: 'tirage', titre: 'Votre contrainte', pistes: [
        'Interdit de regarder vos téléphones de toute la soirée, sauf pour une photo.',
        'Vous commandez chacun pour l’autre.',
        'Vous parlez à au moins une personne que vous ne connaissez pas.',
        'Vous rentrez par un autre chemin que l’aller.',
        'Vous devez ramener un objet à moins de 2 000 F ou 3 € qui raconte la soirée.',
        'Vous vous donnez des prénoms d’emprunt pour la soirée.'
      ] },
      { t: 'texte', titre: 'C’est parti', corps: 'Pas de discussion. Vous avez une sortie, une contrainte, et une soirée. Si l’un de vous dit « bof », l’autre a le droit de répondre « on y va quand même ».', bouton: 'On sort' }
    ]
  },
  {
    id: 'yeux-fermes-cuisine', titre: 'Les yeux fermés, les mains dans le plat',
    accroche: 'L’un cuisine à l’aveugle. L’autre guide à la voix. Le résultat se mange.',
    territoire: 'vivre', temps: '60', lieux: ['maison'], energies: ['disponibles', 'motives'],
    ambiances: ['drole', 'creatif'], budget: 'petit', mecanique: 'Jeu en cuisine',
    ilVousFaut: 'Un plat simple que vous savez faire. Un foulard. Pas de friture, pas de couteau à la première manche.',
    avant: 'Un plat que vous faites d’habitude. Ce soir, l’un a les yeux bandés et fait tout : l’autre guide uniquement à la voix, sans toucher. À mi-parcours, on inverse. Ça va être long, raté par endroits, et très drôle. On mange ce qui sort.',
    etapes: [
      { t: 'texte', titre: 'La préparation', corps: 'Sortez tout sur le plan de travail avant de bander les yeux. Choisissez qui commence. Celui qui guide ne touche à rien, même quand ça part de travers. Surtout quand ça part de travers.', bouton: 'On commence' },
      { t: 'chrono', minutes: 20, titre: 'Première manche', interdits: ['Toucher', 'Soupirer', 'Reprendre la main'], pistes: [
        'Guide : décris où est l’objet par rapport à sa main, pas par rapport à toi.',
        'Aveugle : dis à voix haute ce que tu sens. Ça aide l’autre à guider.',
        'Guide : un compliment toutes les trois instructions, minimum.'
      ] },
      { t: 'texte', titre: 'On inverse', corps: 'Le foulard change de tête. Deuxième manche, même règle, et le plat se finit comme il peut.', bouton: 'Deuxième manche' },
      { t: 'chrono', minutes: 20, titre: 'Deuxième manche', interdits: ['Toucher', 'Soupirer', 'Reprendre la main'], pistes: [
        'Guide : qu’est-ce que tu as appris de la première manche sur la façon dont l’autre explique ?',
        'Aveugle : qu’est-ce qui te rassure dans sa voix ?'
      ] },
      { t: 'texte', titre: 'À table', corps: 'Prenez une photo du résultat avant de goûter. Mangez. Celui qui dit « c’est pas si mal » a gagné.', bouton: 'Terminer' }
    ]
  },
  {
    id: 'six-photos', titre: 'Six photos de nous',
    accroche: 'Une liste, une demi-journée, et la ville comme décor.',
    territoire: 'vivre', temps: 'demi', lieux: ['dehors'], energies: ['aventureux', 'motives'],
    ambiances: ['creatif', 'drole'], budget: 'gratuit', mecanique: 'Défi photo',
    ilVousFaut: 'Un téléphone avec de la batterie. Des chaussures pour marcher. Une demi-journée sans rendez-vous.',
    avant: 'Six photos à prendre dans la journée, données une par une. Vous ne connaissez pas la suivante avant d’avoir fait celle-ci. Certaines vous feront chercher, d’autres vous feront demander de l’aide à des inconnus. À la fin, les six vont dans vos souvenirs.',
    etapes: [
      { t: 'souvenir', mode: 'photo', pistes: [
        'Vous deux devant une porte que vous n’avez jamais franchie.',
        'Un reflet de vous deux, dans autre chose qu’un miroir.',
        'Un inconnu qui vous prend en photo, en train de rire. Il faut lui demander.',
        'Ce que l’un de vous mange, tenu par l’autre.',
        'Vous deux, de dos, devant quelque chose de grand.',
        'La photo que l’autre choisit. Il décide tout : le lieu, la pose, le moment.'
      ] }
    ]
  },
  {
    id: 'pile-ou-face', titre: 'Le week-end à pile ou face',
    accroche: 'Chaque décision du week-end se tire à pile ou face. Vous proposez, la pièce tranche.',
    territoire: 'vivre', temps: 'weekend', lieux: ['partout'], energies: ['aventureux'],
    ambiances: ['spontane', 'drole'], budget: 'libre', mecanique: 'Jeu sur deux jours',
    ilVousFaut: 'Une pièce. Deux jours sans obligations, ou presque. Un budget plafond fixé le vendredi soir.',
    avant: 'À chaque carrefour du week-end, deux propositions : une par personne. La pièce décide. Vous ne négociez pas. Vous n’avez pas le droit de proposer deux fois la même chose. Le dimanche soir, vous aurez vécu un week-end que ni l’un ni l’autre n’aurait planifié.',
    etapes: [
      { t: 'texte', titre: 'Vendredi soir', corps: 'Fixez le budget plafond et les deux seules choses non négociables (une chacun). Tout le reste passera par la pièce.', bouton: 'Les règles sont posées' },
      { t: 'texte', titre: 'Les carrefours', corps: 'Petit-déjeuner : où ? Matinée : quoi ? Déjeuner : dedans ou dehors ? Après-midi : loin ou près ? Soirée : calme ou bruyante ? Dimanche matin : grasse matinée ou sortie tôt ? À chaque fois, deux propositions, une pièce.', bouton: 'Compris' },
      { t: 'texte', titre: 'Dimanche soir', corps: 'Racontez-vous le week-end comme si vous le racontiez à un ami : la pièce a choisi quoi, et ce que vous auriez raté sans elle.', bouton: 'Terminer' }
    ]
  },
  {
    id: 'raconte-moi-encore', titre: 'Raconte-moi encore',
    accroche: 'Une histoire que l’autre n’a jamais entendue. Même après dix ans.',
    territoire: 'vivre', temps: '30', lieux: ['voiture', 'distance', 'partout'], energies: ['fatigues', 'tranquilles'],
    ambiances: ['leger', 'tendre'], budget: 'gratuit', mecanique: 'Récit à tour de rôle', decouverte: true,
    ilVousFaut: 'Rien. Ça marche en voiture, au téléphone, en vocal.',
    avant: 'Vous croyez avoir tout raconté. Il reste toujours une histoire d’enfance, un été, une bêtise, une personne, un lieu, que l’autre n’a jamais entendus. Chacun en raconte une, en entier, sans être coupé.',
    etapes: [
      { t: 'tirage', titre: 'L’histoire du premier', pistes: [
        'Une bêtise d’enfant pour laquelle tu n’as jamais été pris(e).',
        'Un été dont tu ne m’as jamais parlé.',
        'Une personne qui a compté avant moi, et ce qu’elle t’a appris.',
        'Le jour où tu as eu le plus peur, avant qu’on se connaisse.',
        'Un endroit de ton enfance que tu aimerais me montrer.',
        'La chose la plus gentille qu’un inconnu a faite pour toi.'
      ] },
      { t: 'tirage', titre: 'L’histoire du second', pistes: [
        'Un rêve que tu faisais souvent, enfant.',
        'Une fois où tu as menti et où tu t’en veux encore un peu.',
        'Un professeur, un adulte, qui t’a dit une phrase que tu n’as pas oubliée.',
        'Un objet que tu as perdu et qui te manque.',
        'Un voyage raté qui est devenu une bonne histoire.',
        'Le premier plat que tu as réussi tout(e) seul(e).'
      ] }
    ]
  },
  {
    id: 'nuit-ailleurs', titre: 'Une nuit ailleurs',
    accroche: 'Un sac chacun, un lit qui n’est pas le vôtre, et personne qui vous attend.',
    territoire: 'vivre', temps: 'weekend', lieux: ['dehors'], energies: ['motives', 'aventureux'],
    ambiances: ['romantique', 'spontane'], budget: 'libre', mecanique: 'Préparer, puis partir',
    ilVousFaut: 'Une nuit de garde pour les enfants s’il y en a. Un budget. Un sac léger.',
    avant: 'Pas un voyage. Une nuit. Trente kilomètres suffisent. Ce qui compte, c’est de ne pas dormir chez vous, de ne pas avoir la vaisselle en face, et de se réveiller sans personne à préparer. La plateforme vous aide à décider vite, parce que c’est la décision qui bloque, pas l’argent.',
    etapes: [
      { t: 'texte', titre: 'Décider en dix minutes', corps: 'Chacun propose un lieu à moins de deux heures. On tire au sort si on n’est pas d’accord. On réserve ce soir, pas « cette semaine ». La date dans les trois semaines.', bouton: 'C’est réservé' },
      { t: 'texte', titre: 'Les règles de la nuit', corps: 'Pas de réveil. Pas de programme le matin. Une seule obligation : un repas pris dehors, sans téléphone sur la table.', bouton: 'Compris' },
      { t: 'texte', titre: 'Avant de rentrer', corps: 'Prenez une photo du lit défait et mettez-la dans vos souvenirs. Décidez de la prochaine nuit ailleurs avant d’être rentrés : c’est le seul moment où on la décide vraiment.', bouton: 'Terminer' }
    ]
  },
  {
    id: 'carte-du-monde', titre: 'Notre carte du monde',
    accroche: 'Cinq endroits où aller un jour. Un seul qu’on planifie ce soir.',
    territoire: 'vivre', temps: '30', lieux: ['maison'], energies: ['tranquilles', 'disponibles'],
    ambiances: ['creatif', 'leger'], budget: 'gratuit', mecanique: 'Liste d’envies',
    ilVousFaut: 'Trente minutes. Vos envies de voyage, même celles qui semblent impossibles.',
    avant: 'Chacun donne cinq lieux : des pays, des villes, le village de la grand-mère, un restaurant à l’autre bout de la ville. Ils entrent dans vos envies. Puis vous en choisissez un, un seul, et vous lui donnez une date, même approximative.',
    etapes: [
      { t: 'liste-envies', titre: 'Vos cinq lieux chacun', consigne: 'Un lieu par ligne. Précisez qui le propose.', type: 'destination' },
      { t: 'conversation', titre: 'Le premier', pistes: ['Choisissez-en un dans la liste. Pas le plus beau : le plus faisable dans les douze mois. Donnez-lui un mois.'] }
    ]
  },
  {
    id: 'a-ton-tour-de-choisir', titre: 'À ton tour de choisir',
    accroche: 'Une heure où l’un décide tout. Puis on inverse.',
    territoire: 'vivre', temps: '60', lieux: ['maison', 'dehors'], energies: ['disponibles', 'motives'],
    ambiances: ['leger', 'spontane'], budget: 'petit', mecanique: 'Jeu',
    ilVousFaut: 'Deux heures devant vous. La première appartient à l’un, la seconde à l’autre.',
    avant: 'Dans un couple, l’un décide souvent plus que l’autre, sans que personne ne l’ait voulu. Ce soir, on rend ça visible et on en joue : pendant une heure, l’un décide tout, et l’autre suit sans commentaire. Puis on inverse.',
    etapes: [
      { t: 'choix', cle: 'premier', titre: 'Qui décide en premier ?', question: 'L’autre aura la deuxième heure.', options: ['A', 'B'] },
      { t: 'chrono', minutes: 60, titre: 'Première heure', interdits: ['« Tu es sûr(e) ? »', 'Négocier', 'Proposer autre chose'], pistes: [
        'Celui qui décide : choisis quelque chose que tu as envie de faire et que tu ne proposes jamais, parce que tu crois que l’autre n’aimera pas.',
        'Celui qui suit : remarque ce que ça te fait de ne rien décider. C’est reposant ou c’est inconfortable ?'
      ] },
      { t: 'chrono', minutes: 60, titre: 'Deuxième heure', interdits: ['« Tu es sûr(e) ? »', 'Négocier', 'Proposer autre chose'], pistes: [
        'Même règle, autre chef. Et à la fin, dites-vous laquelle des deux heures vous a le plus surpris.'
      ] }
    ]
  }
];

/* Les cartes du Canari, pour amorcer le prototype. */
BA.canariExemples = [
  'J’aimerais qu’on retourne à cet endroit où on a mangé sous la pluie.',
  'J’aimerais que tu choisisses notre prochaine sortie, sans me demander mon avis.',
  'J’ai envie qu’on danse ensemble, n’importe où.',
  'J’aimerais passer une nuit ailleurs, même tout près.',
  'J’aimerais qu’on refasse ce plat raté, et qu’on le rate encore.'
];
