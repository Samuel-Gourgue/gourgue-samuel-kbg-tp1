import WebPostsModel from '../models/webposts.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';

export default class WebpostsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new WebPostsModel()));
    }
}
