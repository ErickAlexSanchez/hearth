export type Locale = 'en' | 'es'

export const DEMO_MEMBERS_POST_PATH = '/posts/33333333-3333-4333-8333-333333333333'
export const DEMO_MEMBERS_POST_URL = `http://127.0.0.1:3301${DEMO_MEMBERS_POST_PATH}`

const JULES = 'jules@hearth.example / hearth-demo-member'
const MIRA = 'mira@hearth.example / hearth-demo-free'

export type Messages = {
  skip: string
  primaryNav: string
  feed: string
  coach: string
  loadingAccount: string
  signIn: string
  signOut: string
  signOutError: string
  member: string
  free: string
  aboutName: string
  close: string
  language: string
  english: string
  spanish: string
  switchToDark: string
  switchToLight: string
  loadingHearth: string
  sessionError: string
  tryAgain: string
  signedOutTitle: string
  signedOutBody: string
  createAccount: string
  signInTitle: string
  signUpTitle: string
  signInLede: string
  signUpLede: string
  displayNameLabel: string
  emailLabel: string
  passwordLabel: string
  signingIn: string
  creatingAccount: string
  createAccountSubmit: string
  signInFailed: string
  signUpFailed: string
  reachFailed: string
  alreadyHaveAccount: string
  newHere: string
  feedLede: string
  loadingFeed: string
  feedError: string
  emptyFeed: string
  loadingMore: string
  loadMore: string
  composerLabel: string
  closeComposer: string
  writePost: string
  postLabel: string
  visibilityLabel: string
  everyone: string
  members: string
  publishError: string
  publishing: string
  publish: string
  cancel: string
  openPost: (name: string) => string
  postTitle: string
  signInToReadPost: string
  loadingPost: string
  membersOnly: string
  backToFeed: string
  postUnavailable: string
  postError: string
  noteLabel: string
  noteBody: string
  habitQuestion: string
  coachReplyError: string
  coachReplying: string
  askCoach: string
  signInHabit: string
  loadingNotes: string
  notesError: string
  emptyNotes: string
  hearthCoach: string
  you: string
  whatTitle: string
  whatBody: string
  caseTitle: string
  caseBody: string
  architectureTitle: string
  architectureBody: string
  demoTitle: string
  demoIntro: string
  julesAccount: string
  miraAccount: string
  membersLead: string
  membersResult: string
  tryIt: string
}

export const messages: Record<Locale, Messages> = {
  en: {
    skip: 'Skip to content',
    primaryNav: 'Primary',
    feed: 'Feed',
    coach: 'Coach',
    loadingAccount: 'Loading account…',
    signIn: 'Sign in',
    signOut: 'Sign out',
    signOutError: 'Could not sign out.',
    member: 'Member',
    free: 'Free',
    aboutName: 'About this demo',
    close: 'Close',
    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
    switchToDark: 'Switch to dark theme',
    switchToLight: 'Switch to light theme',
    loadingHearth: 'Loading Hearth…',
    sessionError: 'Could not load your session.',
    tryAgain: 'Try again',
    signedOutTitle: 'The feed is for people at Hearth',
    signedOutBody: 'Sign in to read posts and keep a habit note.',
    createAccount: 'Create an account',
    signInTitle: 'Sign in',
    signUpTitle: 'Create your account',
    signInLede: 'Welcome back to your hearth.',
    signUpLede: 'Start a free hearth and keep a few habits in view.',
    displayNameLabel: 'Display name',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    signingIn: 'Signing in…',
    creatingAccount: 'Creating account…',
    createAccountSubmit: 'Create account',
    signInFailed: 'Could not sign in.',
    signUpFailed: 'Could not create the account.',
    reachFailed: 'Could not reach Hearth.',
    alreadyHaveAccount: 'Already have an account?',
    newHere: 'New here?',
    feedLede: 'A short shared record of habits worth repeating.',
    loadingFeed: 'Loading the feed…',
    feedError: 'Could not load the feed.',
    emptyFeed: 'No posts yet. Write the first one.',
    loadingMore: 'Loading more posts…',
    loadMore: 'Load more posts',
    composerLabel: 'Post composer',
    closeComposer: 'Close composer',
    writePost: 'Write a post',
    postLabel: 'Post',
    visibilityLabel: 'Who can read this',
    everyone: 'Everyone',
    members: 'Members',
    publishError: 'Could not publish the post.',
    publishing: 'Publishing…',
    publish: 'Publish',
    cancel: 'Cancel',
    openPost: (name) => `Open post by ${name}`,
    postTitle: 'Post',
    signInToReadPost: 'Sign in to read this post.',
    loadingPost: 'Loading the post…',
    membersOnly: 'This post is for members.',
    backToFeed: 'Back to the feed',
    postUnavailable: 'This post is not available.',
    postError: 'Could not load this post.',
    noteLabel: 'Note:',
    noteBody:
      'Hearth Coach shares general habit ideas. This is not medical advice. It will not diagnose you or suggest a dose.',
    habitQuestion: 'Habit question',
    coachReplyError: 'The coach could not reply. Try again.',
    coachReplying: 'Coach is replying…',
    askCoach: 'Ask the coach',
    signInHabit: 'Sign in to ask about a habit you want to repeat.',
    loadingNotes: 'Loading your habit notes…',
    notesError: 'Could not load your habit notes.',
    emptyNotes: 'No habit notes yet. Ask about one routine you want to repeat.',
    hearthCoach: 'Hearth Coach',
    you: 'You',
    whatTitle: 'What this app is',
    whatBody:
      'Hearth is a short feed of everyday habits and a coach for routines you want to repeat. The coach shares general habit ideas only. This is not medical advice. It does not diagnose and it does not suggest a dose.',
    caseTitle: 'Case study',
    caseBody:
      'This is a portfolio version of a confidential product. The company policy does not allow the real product to be shown, so the original work cannot be published. This demo follows the same architecture decisions, with a different scope, brand, and data. Hearth is a fictional brand. It is not the client\'s codebase.',
    architectureTitle: 'Architecture and why',
    architectureBody:
      'Hearth is a modular monolith. Postgres is the source of truth, so membership, posts, and coach notes stay consistent in one database. Entitlements are checked on the server, so a free account cannot read a members-only post by calling the API. The coach schema is isolated from the feed, with stricter access and a shorter retention window, so habit conversations are not mixed into the public record. TanStack Query owns the paginated feed, the open post, the session, and the coach thread. Redux stores only UI state: whether the composer is open and the local draft. The coach reply is streamed with Cache-Control: no-store, so a shared cache cannot keep it. Feed reads go through DATABASE_READ_URL. In this demo that URL points at the same Postgres.',
    demoTitle: 'Demo access and how to try it',
    demoIntro: 'Two seeded accounts are ready.',
    julesAccount: `${JULES} is a member and can publish a members-only post.`,
    miraAccount: `${MIRA} is free. A public post and the coach stay available.`,
    membersLead: 'Members-only post:',
    membersResult: 'returns the locked state for Mira.',
    tryIt:
      'Sign in as Jules to publish a habit note and open the coach. Sign out, sign in as Mira, and open the members-only post to see the locked state.',
  },
  es: {
    skip: 'Saltar al contenido',
    primaryNav: 'Principal',
    feed: 'Publicaciones',
    coach: 'Coach',
    loadingAccount: 'Cargando la cuenta…',
    signIn: 'Entrar',
    signOut: 'Salir',
    signOutError: 'No se pudo salir.',
    member: 'Miembro',
    free: 'Gratis',
    aboutName: 'Acerca de esta demo',
    close: 'Cerrar',
    language: 'Idioma',
    english: 'Inglés',
    spanish: 'Español',
    switchToDark: 'Cambiar a tema oscuro',
    switchToLight: 'Cambiar a tema claro',
    loadingHearth: 'Cargando Hearth…',
    sessionError: 'No se pudo cargar tu sesión.',
    tryAgain: 'Reintentar',
    signedOutTitle: 'Las publicaciones son para quienes están en Hearth',
    signedOutBody: 'Entra para leer publicaciones y guardar una nota de hábito.',
    createAccount: 'Crear una cuenta',
    signInTitle: 'Entrar',
    signUpTitle: 'Crea tu cuenta',
    signInLede: 'Qué bueno volver a Hearth.',
    signUpLede: 'Empieza gratis y deja unos hábitos a la vista.',
    displayNameLabel: 'Nombre',
    emailLabel: 'Correo',
    passwordLabel: 'Contraseña',
    signingIn: 'Entrando…',
    creatingAccount: 'Creando la cuenta…',
    createAccountSubmit: 'Crear cuenta',
    signInFailed: 'No se pudo entrar.',
    signUpFailed: 'No se pudo crear la cuenta.',
    reachFailed: 'No se pudo conectar con Hearth.',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    newHere: '¿Primera vez aquí?',
    feedLede: 'Un registro breve y compartido de hábitos que vale la pena repetir.',
    loadingFeed: 'Cargando las publicaciones…',
    feedError: 'No se pudieron cargar las publicaciones.',
    emptyFeed: 'Aún no hay publicaciones. Escribe la primera.',
    loadingMore: 'Cargando más publicaciones…',
    loadMore: 'Cargar más publicaciones',
    composerLabel: 'Redactar publicación',
    closeComposer: 'Cerrar el redactor',
    writePost: 'Escribir una publicación',
    postLabel: 'Publicación',
    visibilityLabel: 'Quién puede leer esto',
    everyone: 'Todas las personas',
    members: 'Miembros',
    publishError: 'No se pudo publicar.',
    publishing: 'Publicando…',
    publish: 'Publicar',
    cancel: 'Cancelar',
    openPost: (name) => `Abrir la publicación de ${name}`,
    postTitle: 'Publicación',
    signInToReadPost: 'Entra para leer esta publicación.',
    loadingPost: 'Cargando la publicación…',
    membersOnly: 'Esta publicación es para miembros.',
    backToFeed: 'Volver a las publicaciones',
    postUnavailable: 'Esta publicación no está disponible.',
    postError: 'No se pudo cargar esta publicación.',
    noteLabel: 'Nota:',
    noteBody:
      'Hearth Coach comparte ideas generales de hábitos. Esto no es consejo médico. No diagnostica ni sugiere una dosis.',
    habitQuestion: 'Pregunta sobre un hábito',
    coachReplyError: 'El coach no pudo responder. Inténtalo de nuevo.',
    coachReplying: 'El coach está respondiendo…',
    askCoach: 'Preguntar al coach',
    signInHabit: 'Entra para preguntar por un hábito que quieras repetir.',
    loadingNotes: 'Cargando tus notas de hábitos…',
    notesError: 'No se pudieron cargar tus notas de hábitos.',
    emptyNotes: 'Aún no hay notas de hábitos. Pregunta por una rutina que quieras repetir.',
    hearthCoach: 'Hearth Coach',
    you: 'Tú',
    whatTitle: 'Qué es esta aplicación',
    whatBody:
      'Hearth es un feed breve de hábitos cotidianos y un coach para rutinas que quieres repetir. El coach solo comparte ideas generales de hábitos. Esto no es consejo médico. No diagnostica y no sugiere una dosis.',
    caseTitle: 'Caso de estudio',
    caseBody:
      'Esta es una versión de portafolio de un producto confidencial. La política de la empresa no permite mostrar el producto real, así que el trabajo original no se puede publicar. Esta demo sigue las mismas decisiones de arquitectura, con otro alcance, otra marca y otros datos. Hearth es una marca ficticia. No es el código del cliente.',
    architectureTitle: 'Arquitectura y por qué',
    architectureBody:
      'Hearth es un monolito modular. Postgres es la fuente de verdad, así que la membresía, las publicaciones y las notas del coach se mantienen consistentes en una base de datos. Los entitlements se comprueban en el servidor, de modo que una cuenta gratuita no puede leer una publicación solo para miembros llamando a la API. El esquema del coach está aislado del feed, con acceso más estricto y una retención más corta, para que las conversaciones de hábitos no se mezclen con el registro público. TanStack Query pagina el feed, la publicación abierta, la sesión y el hilo del coach. Redux guarda solo el estado de la interfaz: si el redactor está abierto y el borrador local. El coach responde en stream con Cache-Control: no-store, para que una caché compartida no lo conserve. Las lecturas del feed pasan por DATABASE_READ_URL. En esta demo esa URL apunta al mismo Postgres.',
    demoTitle: 'Acceso a la demo y cómo probarla',
    demoIntro: 'Hay dos cuentas de prueba.',
    julesAccount: `${JULES} es miembro y puede publicar una nota solo para miembros.`,
    miraAccount: `${MIRA} es gratis. Una publicación pública y el coach siguen disponibles.`,
    membersLead: 'Publicación solo para miembros:',
    membersResult: 'devuelve el estado bloqueado para Mira.',
    tryIt:
      'Entra como Jules para publicar una nota de hábito y abrir el coach. Sal, entra como Mira y abre la publicación solo para miembros para ver el estado bloqueado.',
  },
}
