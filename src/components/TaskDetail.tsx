// src/components/TaskDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { Task, Allegato } from "../types";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FlaskConical,
  XCircle,
  Calendar,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Paperclip,
  Upload,
  Download,
  X,
  Image,
  FileText,
  MessageSquare,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

const TaskDetail: React.FC = () => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [allegati, setAllegati] = useState<Allegato[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { dispatch } = useApp();
  const { canModifyTask } = useAuth();
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const [taskData, allegatiData] = await Promise.all([
          apiService.getTaskById(taskId!),
          apiService.getTaskAllegati(parseInt(taskId!)),
        ]);
        setTask(taskData as Task);
        setAllegati(allegatiData);
      } catch (error) {
        console.error("Error fetching task:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Error loading task details",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId, dispatch]);

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case "aperto":
        return "bg-red-100 text-red-800 border border-red-200";
      case "in corso":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "chiuso":
        return "bg-green-100 text-green-800 border border-green-200";
      case "testing":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "test fallito":
        return "bg-pink-100 text-pink-800 border border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case "aperto":
        return <AlertCircle className="h-4 w-4" />;
      case "in corso":
        return <Clock className="h-4 w-4" />;
      case "chiuso":
        return <CheckCircle className="h-4 w-4" />;
      case "testing":
        return <FlaskConical className="h-4 w-4" />;
      case "test fallito":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-800 border border-red-200";
      case "media":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "bassa":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "alta":
        return <AlertTriangle className="h-4 w-4" />;
      case "media":
        return <AlertTriangle className="h-4 w-4" />;
      case "bassa":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleDelete = () => {
    if (!task) return;
    setConfirmModal({
      isOpen: true,
      title: "Conferma Eliminazione",
      message: `Sei sicuro di voler eliminare il task "${task.codiceTask}"?`,
      onConfirm: async () => {
        try {
          await apiService.deleteTask(task.id!);
          navigate("/", { replace: true });
        } catch (error) {
          console.error("Error deleting task:", error);
          dispatch({
            type: "SET_ERROR",
            payload: "Error deleting task",
          });
        }
      },
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Il file è troppo grande. Massimo 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        const nuovoAllegato: Omit<Allegato, "id"> = {
          allegato: base64,
          idTask: task.id!,
        };
        const allegatoCreato = await apiService.createAllegato(nuovoAllegato);
        setAllegati((prev) => [allegatoCreato, ...prev]);
        setShowUploadForm(false);
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Errore durante il caricamento del file");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAllegato = async (id: number) => {
    if (confirm(`Sei sicuro di voler eliminare questo allegato?`)) {
      try {
        await apiService.deleteAllegato(id);
        setAllegati((prev) => prev.filter((a) => a.id !== id));
      } catch (error) {
        console.error("Error deleting attachment:", error);
        alert("Errore durante l'eliminazione dell'allegato");
      }
    }
  };

  const downloadAllegato = (allegato: Allegato) => {
    const link = document.createElement("a");
    link.href = allegato.allegato;
    const mimeMatch = allegato.allegato.match(/data:([^;]+)/);
    let fileName = `allegato_${allegato.id}`;
    if (mimeMatch) {
      const mimeType = mimeMatch[1];
      if (mimeType.startsWith("image/")) {
        fileName = `allegato_${allegato.id}.${mimeType.split("/")[1]}`;
      } else if (mimeType.includes("pdf")) fileName += ".pdf";
      else if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
        fileName += ".xlsx";
      else if (mimeType.includes("word") || mimeType.includes("document"))
        fileName += ".docx";
      else if (
        mimeType.includes("powerpoint") ||
        mimeType.includes("presentation")
      )
        fileName += ".pptx";
      else fileName += ".txt";
    }
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const separateAllegati = () => {
    const immagini = allegati.filter((a) =>
      a.allegato.startsWith("data:image/")
    );
    const documenti = allegati.filter(
      (a) => !a.allegato.startsWith("data:image/")
    );
    return { immagini, documenti };
  };

  const getFileIcon = (allegato: Allegato) => {
    const mimeType = allegato.allegato.match(/data:([^;]+)/)?.[1] || "";
    if (mimeType.includes("pdf"))
      return <FileText className="h-5 w-5 text-red-600" />;
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return <FileText className="h-5 w-5 text-green-600" />;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return <FileText className="h-5 w-5 text-blue-600" />;
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return <FileText className="h-5 w-5 text-orange-600" />;
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

  const getFileTypeLabel = (allegato: Allegato) => {
    const mimeType = allegato.allegato.match(/data:([^;]+)/)?.[1] || "";
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "Excel";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "Word";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "PowerPoint";
    if (mimeType.includes("text/plain")) return "Testo";
    return "Documento";
  };

  const { immagini, documenti } = separateAllegati();

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  if (!task)
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-medium">Task non trovato</h2>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-3 lg:p-4 space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Torna indietro
      </button>

      {/* Header Task */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {task.codiceTask}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatoColor(
                task.stato
              )}`}
            >
              {getStatoIcon(task.stato)}
              <span className="ml-1 capitalize">{task.stato}</span>
            </span>
          </div>

          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
            <h3 className="text-xs font-medium text-blue-800 mb-1 flex items-center">
              <MessageSquare className="h-3 w-3 mr-1" /> Descrizione
            </h3>
            <p className="text-sm text-gray-900 leading-snug">
              {task.descrizione}
            </p>
          </div>
        </div>

        <div className="flex space-x-2 shrink-0">
          <button
            onClick={() => navigate(`/task/${task.id}/edit`)}
            disabled={!canModifyTask(task)}
            className={`p-2 rounded-full transition-colors flex items-center ${
              canModifyTask(task)
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            title="Modifica task"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={!canModifyTask(task)}
            className={`p-2 rounded-full transition-colors flex items-center ${
              canModifyTask(task)
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            title="Elimina task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Task Details */}
      <div className="bg-white p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Dettagli Task
          </h3>

          {task.rifTicket && (
            <div className="flex items-start">
              <Tag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Rif. Ticket</p>
                <p className="text-gray-900">{task.rifTicket}</p>
              </div>
            </div>
          )}

          <div className="flex items-start">
            <Tag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Software</p>
              <p className="text-gray-900">{task.software}</p>
            </div>
          </div>

          <div className="flex items-start">
            <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Assegnato a</p>
              <p className="text-gray-900">
                {task.utenti?.join(", ") ?? task.utente}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Cliente</p>
              <p className="text-gray-900">{task.clienti}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Stato e Scadenze
          </h3>

          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Priorità</p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-1 ${getPriorityColor(
                  task.priorità
                )}`}
              >
                {getPriorityIcon(task.priorità)}
                <span className="ml-1 capitalize">{task.priorità}</span>
              </span>
            </div>
          </div>

          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Segnalato il</p>
              <p className="text-gray-900">
                {new Date(task.dataSegnalazione).toLocaleDateString("it-IT", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Scadenza</p>
              <p className="text-gray-900">
                {new Date(task.dataScadenza).toLocaleDateString("it-IT", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Ore Stimate / Ore Dedicate */}
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div className="w-full">
              <p className="text-sm font-medium text-gray-500">Ore stimate</p>
              <p className="text-gray-900">{task.oreStimate ?? 0}</p>
            </div>
          </div>

          <div className="flex items-start mt-2">
            <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div className="w-full">
              <p className="text-sm font-medium text-gray-500">Ore dedicate</p>
              <p className="text-gray-900">{task.oreDedicate ?? 0}</p>

              {/* Barra di avanzamento */}
              {(task.oreStimate ?? 0) > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>
                      Avanzamento:{" "}
                      {(
                        ((task.oreDedicate ?? 0) / (task.oreStimate ?? 1)) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                    <span>
                      {task.oreDedicate ?? 0}/{task.oreStimate ?? 0} h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          ((task.oreDedicate ?? 0) / (task.oreStimate ?? 1)) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Commenti */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" /> Commenti
        </h3>

        {task.commenti ? (
          <div className="space-y-4">
            {task.commenti.split("\n").map(
              (c, i) =>
                c.trim() && (
                  <div
                    key={i}
                    className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 text-gray-700"
                  >
                    <div className="flex items-center mb-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs text-gray-500">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    {c}
                  </div>
                )
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <MessageSquare className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p>Nessun commento presente</p>
          </div>
        )}
      </div>

      {/* Allegati */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Paperclip className="h-5 w-5 mr-2 text-blue-600" /> Allegati (
            {allegati.length})
          </h3>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" /> <span>Carica allegato</span>
          </button>
        </div>

        {showUploadForm && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">
                Carica nuovo allegato
              </h4>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-blue-700 mt-2">
              Supportati: immagini (JPG, PNG, GIF, WebP), PDF, Word, Excel,
              PowerPoint, testo (max 10MB)
            </p>
          </div>
        )}

        {/* Immagini */}
        {immagini.length > 0 && (
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <Image className="h-5 w-5 mr-2 text-blue-600" /> Immagini (
              {immagini.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {immagini.map((allegato) => (
                <div
                  key={allegato.id}
                  className="relative group rounded-xl overflow-hidden border border-gray-200"
                >
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={allegato.allegato}
                      alt={`Allegato ${allegato.id}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 transform group-hover:scale-105"
                      onClick={() => setPreviewImage(allegato.allegato)}
                    />
                  </div>
                  <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => downloadAllegato(allegato)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                      title="Scarica immagine"
                    >
                      <Download className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteAllegato(allegato.id!)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                      title="Elimina immagine"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                  <div className="p-3 bg-white border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Immagine #{allegato.id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documenti */}
        {documenti.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" /> Documenti (
              {documenti.length})
            </h4>
            <div className="space-y-3">
              {documenti.map((allegato) => (
                <div
                  key={allegato.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(allegato)}
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {getFileTypeLabel(allegato)} #{allegato.id}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadAllegato(allegato)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Scarica documento"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAllegato(allegato.id!)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Elimina documento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allegati.length === 0 && !showUploadForm && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Paperclip className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="mb-2">Nessun allegato presente</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Carica il primo allegato
            </button>
          </div>
        )}
      </div>

      {/* Modal Conferma */}
      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirmModal}
        />
      )}

      {/* Preview Immagine */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-full max-w-full">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-full max-w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
