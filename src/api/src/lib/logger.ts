import winston, { createLogger, format, transports } from 'winston';
import { config } from '../../config.ts';
import path from "node:path";

const logDir = path.resolve('./logs'); // dossier où ranger les fichiers logs

// transporter de log HTTP --> vers notre micro-service de log
const httpTransport = new transports.Http({
  host: config.logServiceHost, 
  port: config.logServicePort,
  path: '/api/logs', // endpoint où envoyer les log en POST HTTP
  level: 'http', // niveau de log traité par le transorteur
});

// si une erreur survient lors de l'envois des logs vers le micro-service
// normalement l'erreur est attrapée par express qui log l'erreur pour la renvoyer vers le micro-service, etc.
// potentiel problème de boucle infinie
// donc si une erreur survient dans le transporter HTTP on l'attrape et on l'affiche dans la console
// ici "warn" fait référence à l'évènement "warning" une erreur est survenue dans le transporter
// et non à "warn" le niveau de log
// C'est un transporteur HTTP _très_ basique : il lève une erreur dès qu'il reçoit autre chose que 200 OK
// Exemple : 201 CREATE le fait lever une erreur ! --> attention aux requete POST côté micro-service !
httpTransport.on('warn', (error) => {
  // Si une erreur est détectée dans le transporteur HTTP,
  // on affiche l'erreur directement dans le terminal, et c'est tout
  // --> empèche winston de traiter cette erreur et éventuellement la renvoyer N fois vers l'API de log
  console.error('Transport HTTP des logs :', error);
});

export const logger: winston.Logger = createLogger({
  // silly → debug → verbose → http → info → warn → error
  level: config.logLevel, // filtre : seuil des logs à enregistrer
  defaultMeta: { service: 'oquiz' }, // information ajoutée systématiquement à tous les logs

  format: format.combine(
    format.timestamp(), // ajoute la date courante au log
    format.errors({ stack: true }), // ajoute la stack trace si on log une erreur
    format.json(), // formatte les message de log en JSON
  ),

  transports: [ // les transporters d'erreur --> vers où et comment envoyer les logs
    // Logs d'erreur dans un fichier séparé
    new transports.File({
      level: 'error', // filtre : seuil des logs à enregistrer
      filename: path.join(logDir, 'error.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true,
    }),
    // Tous les logs : dans un fichier combiné
    new transports.File({
      // pas la propriété "level", donc ce transporter, traite tous les niveaux de log
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true,
    }),
    httpTransport,
  ],

  // Gérer les exceptions non capturées
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],

  // Gérer les rejets de promesses (Promise de fonction asyc non résolues)
  rejectionHandlers: [
    new transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ],
});

// Ajouter la console comme transporteur, mais uniquement en mode développement
if (config.nodeEnv === 'development') {

  const pid = process.pid;

  logger.add(new transports.Console({
    level: config.logLevel, // filtre : seuil des logs à enregistrer
    format: format.combine(
      format.colorize(),
      format.printf(({ timestamp, level, message, stack, ...meta }) => { // formate les logs affichés dans la console
        // inject processus id (pid) into meta data
        const withPid = {
          ...meta,
          pid
        };
        const metaString = JSON.stringify(withPid, null, 2); // indente les meta avec 2 espaces
        const stackString = stack ? `\n${stack}` : ''; // ajoute la stack trace sur une nouvelle ligne si elle existe
        return `${timestamp} [${level}]: ${message} \n${metaString} \n${stackString}`;
      })
    ),
  })
  );
}