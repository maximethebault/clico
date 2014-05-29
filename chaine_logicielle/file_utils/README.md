Les fichiers contenus dans ce répertoire sont issus de deux libraires :
    -> Wrench, qui fournit des fonctions utilitaires sur les fichiers (notamment des versions récursives de rmdir, readdir, etc.)
    -> FileQueue, qui permet de limiter le nombre d'opérations concurrentes sur le système de fichiers (sinon, on peut atteindre des limites de l'OS sur de gros répertoires)

Ils ne sont pas inclus en tant que modules, car des modifications mineures ont été nécessaires (et pas le temps pour des PR, qui peuvent parfois s'éterniser et déboucher sur rien...)