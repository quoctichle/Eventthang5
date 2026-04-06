export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env
  const body = await readBody(event)

  if (!body.title) {
    throw createError({ statusCode: 400, message: 'title là bắt buộc' })
  }

  const { meta } = await DB.prepare(
    'INSERT INTO events (title, description, date, location) VALUES (?, ?, ?, ?)'
  )
    .bind(body.title, body.description ?? null, body.date ?? null, body.location ?? null)
    .run()

  return { id: meta.last_row_id, ...body }
})
