const mongoose = require('mongoose');
const Recipe = require('../Model/recipe');
const User = require('../Model/user');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const ejs = require('ejs');
const path = require('path');



const toCamelCase = (str) => {
  return str
      .split(' ')
      .map((word, index) => {
          if (index === 0) {
              return word.toLowerCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
}

async function renderHtml(data, pageType, bookTitle) {
  const htmlFilePath = path.join(__dirname, '../Views', `${pageType}.html`);
  const ejsFilePath = path.join(__dirname, '../Views/index.ejs');
  try {
    const renderedHtml = await ejs.renderFile(ejsFilePath, { data, type: pageType, bookTitle });
    await fs.writeFile(htmlFilePath, renderedHtml, 'utf8');
    return htmlFilePath;
  } catch (err) {
    throw new Error(`Error rendering HTML: ${err.message}`);
  }
}

async function convertToPdf(htmlFilePath) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const fileUrl = `file://${path.resolve(htmlFilePath)}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf();
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    throw new Error(`Conversion to PDF failed: ${error.message}`);
  }
}

async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Error deleting file ${filePath}: ${error.message}`);
  }
}

const createRecipeBookPDF = async (req, res, next) => {
  try {
    const PDFMerger = (await import('pdf-merger-js')).default;
    const { userId: author } = req.params;
    const { recipeIds, coverPage, name: bookName, description } = req.body;

    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      author: author,
    })
    .select('details basicInfo nutritionalFacts directions author')
    .populate({
      path: 'author',
      select: 'aboutMe firstName lastName avatar slogan',
    })
    .exec();

    const findAuthor = await User.findById(author)
    .select('aboutMe firstName lastName avatar slogan')
    .exec();

    const allRecipeNames = recipes.map((el) => el.basicInfo.recipeName)
    const recipeNames = allRecipeNames.map(toCamelCase)

    const dynamicData = {
      recipe: recipes,
      author: findAuthor,
      frontCover: {
        firstName: findAuthor.firstName,
        lastName: findAuthor.lastName,
        bookTitle: bookName,
        image: coverPage,
        description: description
      }
    };

    // Render and convert each page to PDF
    const frontPagePath = await renderHtml(dynamicData.frontCover, 'frontPage', bookName);
    const frontPageBuffer = await convertToPdf(frontPagePath);
    await deleteFile(frontPagePath);

    const authorPagePath = await renderHtml(dynamicData.author, 'aboutPage', bookName);
    const authorPageBuffer = await convertToPdf(authorPagePath);
    await deleteFile(authorPagePath);

    const recipePageBuffers = await Promise.all(recipes.map(async (recipe, i) => {
      const recipePagePath = await renderHtml(recipe, recipeNames[i], bookName);
      const pdfBuffer = await convertToPdf(recipePagePath);
      await deleteFile(recipePagePath);
      return pdfBuffer;
    }));

    const merger = new PDFMerger();

    await merger.add(frontPageBuffer);
    await merger.add(authorPageBuffer);

    for (const buffer of recipePageBuffers) {
        await merger.add(buffer);
    }

    const mergedPdfBuffer = await merger.saveAsBuffer();

    console.log("mergedPdfBuffer", mergedPdfBuffer)

    // Send the PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=recipe-book.pdf');
    res.send(mergedPdfBuffer);

  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).send('An error occurred while creating the recipe book PDF.');
    }
  }
};

module.exports = {
  createRecipeBookPDF,
};

const getDataForPDF = async (req, res, next) => {
  try {
    console.log(req.body);
    const author = req.params.userId;
    const recipeIds = req.body.recipeIds;
    const coverPage = req.body.coverPage;
    const bookName = req.body.name;
    const description = req.body.description;
    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      author: author,
    })
    .select('details basicInfo nutritionalFacts directions author')
    .populate({
      path: 'author',
      select: 'aboutMe firstName lastName avatar slogan',
    })
    .exec();

    const findAuthor = await User.findById(author)
    .select('aboutMe firstName lastName avatar slogan')
    .exec();

    const dynamicData = {
        recipe: recipes,
        author: findAuthor,
        frontCover: {
          firstName: findAuthor.firstName,
          lastName: findAuthor.lastName,
          bookTitle: bookName,
          image: coverPage,
          description: description
        }
      };
      res.status(200).json(dynamicData);
  } catch (error) {
    console.log(error);
  }
};
