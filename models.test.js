const { beforeAll, expect, test } = require('@jest/globals')
const { Restaurant, db, Menu, Item } = require('./models')
const data = require('./restaurants.json')


beforeAll(async () => {
    await db.sync().then(async () => {
        const taskQueue = data.map(async (json_restaurant) => {
            const restaurant = await Restaurant.create({ name: json_restaurant.name, image: json_restaurant.image })
            const menus = await Promise.all(json_restaurant.menus.map(async (_menu) => {
                const items = await Promise.all(_menu.items.map(({ name, price }) => Item.create({ name, price })))
                const menu = await Menu.create({ title: _menu.title })
                return menu.setItems(items)
            }))
            return await restaurant.setMenus(menus)
        })
        return Promise.all(taskQueue)
    })
})


describe('Sequelize db', () => {
    test('new restaurants have an id and name in the database', async () => {
        const rest = await Restaurant.create({ name: 'Dim T', image: 'https://food-images.files.bbci.co.uk/food/recipes/vietnamese_beef_pho_22510_16x9.jpg' })
        expect(rest.id).toBe(9)
        expect(rest.name).toBe('Dim T')
    })
    test('new menus are created and stored with an id in the database', async () => {
        const menu = await Menu.create({ title: "Brunch Menu" })
        expect(menu.id).toBe(19)


    })
    test('new items are stored within the database', async () => {
        const item = await Item.create({ name: "Poached Eggs", price: 7.00 })
        expect(item.id).toBe(85)
        expect(item.name).toBe('Poached Eggs')
    })
    test('restaurants can have menus added to them', async () => {
        const rst = await Restaurant.create({ name: "TGIF", image: "https://food-images.files.bbci.co.uk/food/recipes/vietnamese_beef_pho_22510_16x9.jpg" })
        const menu = await Menu.create({ title: "Friday Menu" })
        await rst.addMenu(menu)
        const menus = await rst.getMenus()
        expect(menus[0].title).toBe('Friday Menu')


    })
    test('You can find a restaurant in the db', async () => {
        const rests = await Restaurant.findOne({
            where: {
                name: 'Balthazar'
            }, include: 'menus'
        })
        expect(rests.name).toBe('Balthazar')
        expect(rests.id).toBe(3)
    })
    test('Items belong to menus and menus belongs to restaurants', async () => {
        const menus = await Menu.findOne({
            where: {
                title: 'Grill'
            }, include: 'items'
        })
        expect(menus.items[0].name).toBe('Houmous Shawarma Lamb')
        expect(menus.RestaurantId).toBe(1)
    })
    test('When menus have the same name and we want a specific one we have to find the requested id as well', async () => {
        const menus = await Menu.findOne({
            where: {
                title: 'A La Carte',
                id: 8
            }, include: 'items'
        })
        expect(menus.items[0].name).toBe('Roast butternut soup, butternut hummud, salsify and cob nut')
        expect(menus.RestaurantId).toBe(4)
    })
    test('Can check if an item belongs to a Restaurant ', async () => {
        const rests = await Restaurant.findOne({
            where: {
                name: "Bayroot"
            }, include: [{
                all: true, nested: true
            }]
        });
        expect(rests.menus[0].items[0].name).toBe('Falafel (v)')
    })
})