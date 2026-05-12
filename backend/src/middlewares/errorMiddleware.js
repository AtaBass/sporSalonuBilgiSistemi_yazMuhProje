function notFound(req, res) {
  res.status(404).json({ message: 'Kaynak bulunamadı' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || 'Sunucu hatası';
  res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
