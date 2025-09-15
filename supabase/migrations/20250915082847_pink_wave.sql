/*
  # Creazione tabella Commenti

  1. Nuove Tabelle
    - `Commenti`
      - `id` (int, primary key, auto increment)
      - `commento` (nvarchar(4000), testo del commento)
      - `utente` (nvarchar(50), username dell'utente)
      - `idTask` (int, foreign key verso Task)
      - `datetime` (datetime2, timestamp del commento)
      - `oreDedicate` (decimal(5,2), ore dedicate per questo commento)

  2. Sicurezza
    - Aggiunta di indici per performance
    - Foreign key constraint verso tabella Task

  3. Note
    - La tabella permetterà di tracciare commenti con ore dedicate per ogni task
    - Ogni commento può avere ore dedicate associate
*/

-- Creazione tabella Commenti
CREATE TABLE IF NOT EXISTS Commenti (
    id int IDENTITY(1,1) PRIMARY KEY,
    commento nvarchar(4000) NOT NULL,
    utente nvarchar(50) NOT NULL,
    idTask int NOT NULL,
    datetime datetime2 DEFAULT GETDATE(),
    oreDedicate decimal(5,2) DEFAULT 0,
    CONSTRAINT FK_Commenti_Task FOREIGN KEY (idTask) REFERENCES Task(id) ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS IX_Commenti_idTask ON Commenti(idTask);
CREATE INDEX IF NOT EXISTS IX_Commenti_utente ON Commenti(utente);
CREATE INDEX IF NOT EXISTS IX_Commenti_datetime ON Commenti(datetime DESC);