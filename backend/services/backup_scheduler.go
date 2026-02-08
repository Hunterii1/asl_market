package services

import (
	"archive/zip"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"asl-market-backend/config"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

const (
	uploadsDir  = "uploads"
	backupTmp   = "tmp/backup"
)

// runMidnightBackup creates uploads zip + full DB dump and sends both to Telegram admins.
func runMidnightBackup(telegramService *TelegramService) {
	tmpDir := filepath.Join(backupTmp, time.Now().Format("20060102_150405"))
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		log.Printf("backup: failed to create temp dir %s: %v", tmpDir, err)
		return
	}
	defer func() {
		os.RemoveAll(tmpDir)
	}()

	// 1) Zip uploads
	zipPath := filepath.Join(tmpDir, "uploads_backup.zip")
	if err := zipDir(uploadsDir, zipPath); err != nil {
		log.Printf("backup: zip uploads failed: %v", err)
		notifyBackupError(telegramService, "zip uploads", err)
		return
	}

	// 2) Mysqldump full backup
	sqlPath := filepath.Join(tmpDir, "db_full_backup.sql")
	db := &config.AppConfig.Database
	if err := runMysqldump(db.User, db.Password, db.Host, db.Port, db.Name, sqlPath); err != nil {
		log.Printf("backup: mysqldump failed: %v", err)
		notifyBackupError(telegramService, "mysqldump", err)
		return
	}

	telegramService.SendBackupToAdmins(zipPath, sqlPath)
	log.Printf("backup: nightly backup sent to admins (zip + sql)")
}

// RunBackupForChat creates uploads zip + full DB dump and sends both to the given chatID (e.g. admin who requested).
// Call from a goroutine so the bot stays responsive. On error, sends an error message to chatID.
func RunBackupForChat(telegramService *TelegramService, chatID int64) {
	tmpDir := filepath.Join(backupTmp, "manual_"+time.Now().Format("20060102_150405"))
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		log.Printf("backup: failed to create temp dir %s: %v", tmpDir, err)
		sendBackupErrorToChat(telegramService, chatID, "ایجاد پوشه موقت", err)
		return
	}
	defer os.RemoveAll(tmpDir)

	zipPath := filepath.Join(tmpDir, "uploads_backup.zip")
	if err := zipDir(uploadsDir, zipPath); err != nil {
		log.Printf("backup: zip uploads failed: %v", err)
		sendBackupErrorToChat(telegramService, chatID, "فشرده‌سازی پوشه uploads", err)
		return
	}

	sqlPath := filepath.Join(tmpDir, "db_full_backup.sql")
	db := &config.AppConfig.Database
	if err := runMysqldump(db.User, db.Password, db.Host, db.Port, db.Name, sqlPath); err != nil {
		log.Printf("backup: mysqldump failed: %v", err)
		sendBackupErrorToChat(telegramService, chatID, "بک‌آپ دیتابیس", err)
		return
	}

	telegramService.SendBackupToChat(chatID, zipPath, sqlPath)
	log.Printf("backup: manual backup sent to chat %d", chatID)
}

func sendBackupErrorToChat(t *TelegramService, chatID int64, step string, err error) {
	if t == nil {
		return
	}
	msg := fmt.Sprintf("❌ خطا در بک‌آپ (%s): %v", step, err)
	t.bot.Send(tgbotapi.NewMessage(chatID, msg))
}

func notifyBackupError(t *TelegramService, step string, err error) {
	if t == nil {
		return
	}
	msg := fmt.Sprintf("❌ خطا در بک‌آپ شبانه (%s): %v", step, err)
	for _, adminID := range ADMIN_IDS {
		if _, sendErr := t.bot.Send(tgbotapi.NewMessage(adminID, msg)); sendErr != nil {
			log.Printf("backup: failed to send error to admin %d: %v", adminID, sendErr)
		}
	}
}

// zipDir creates a zip file at zipPath containing the whole dir (relative to cwd).
func zipDir(dir, zipPath string) error {
	f, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer f.Close()
	w := zip.NewWriter(f)
	defer w.Close()

	return filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(dir, path)
		if err != nil {
			return err
		}
		rel = filepath.Join(filepath.Base(dir), rel)
		rel = filepath.ToSlash(rel)

		zf, err := w.Create(rel)
		if err != nil {
			return err
		}
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()
		_, err = io.Copy(zf, file)
		return err
	})
}

// runMysqldump runs: mysqldump -u user -h host -P port --routines --triggers --events --single-transaction db_name > outPath
// Password is passed via MYSQL_PWD so it doesn't appear in process list.
func runMysqldump(user, password, host, port, dbName, outPath string) error {
	f, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer f.Close()

	args := []string{
		"-u", user,
		"-h", host,
		"-P", port,
		"--routines",
		"--triggers",
		"--events",
		"--single-transaction",
		"--set-gtid-purged=OFF",
		dbName,
	}
	cmd := exec.Command("mysqldump", args...)
	cmd.Stdout = f
	cmd.Stderr = os.Stderr
	cmd.Env = append(os.Environ(), "MYSQL_PWD="+password)
	return cmd.Run()
}

// StartBackupScheduler starts a goroutine that runs full backup every night at 00:00 local time
// and sends uploads zip + DB dump to Telegram admins. Call only when telegramService is non-nil.
func StartBackupScheduler(telegramService *TelegramService) {
	if telegramService == nil {
		return
	}
	go func() {
		for {
			now := time.Now()
			midnight := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			if !now.Before(midnight) {
				midnight = midnight.Add(24 * time.Hour)
			}
			d := time.Until(midnight)
			log.Printf("backup: next run at %s (in %s)", midnight.Format("2006-01-02 15:04"), d.Round(time.Second))
			time.Sleep(d)
			runMidnightBackup(telegramService)
		}
	}()
}
