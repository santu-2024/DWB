import React from 'react';
import './style.css';


class Dropdown extends React.Component {
constructor(){
 super();

 this.state = {
       displayMenu: false,
     };

  this.showDropdownMenu = this.showDropdownMenu.bind(this);
  this.hideDropdownMenu = this.hideDropdownMenu.bind(this);

};

showDropdownMenu(event) {
    event.preventDefault();
    this.setState({ displayMenu: true }, () => {
    document.addEventListener('click', this.hideDropdownMenu);
    });
  }

  hideDropdownMenu() {
    this.setState({ displayMenu: false }, () => {
      document.removeEventListener('click', this.hideDropdownMenu);
    });

  }

  render() {
    return (
        <div  className="dropdown">
	        <div className="button" onClick={this.showDropdownMenu}>
            <span>
              <span className="bm-burger-bars"></span>
              <span className="bm-burger-bars"></span>
              <span className="bm-burger-bars"></span>
            </span>
          </div>

          { this.state.displayMenu ? (
          <ul>
    		   <li><a className="active" href="/admin/index.html">Create Page</a></li>
    		   <li><a href="/">Home</a></li>
    		   <li><a href="/year-archive/">Posts</a></li>
    		   <li><a href="/about/">About</a></li>
    		   <li><a href="/sitemap/">Sitemap</a></li>
    		   <li><a href="/userProfile.html">Admin Profile</a></li>
    		   <li><a href="/logout/">Log Out</a></li>
          </ul>
        ):
        (
          null
        )
        }
	      </div>
    );
  }


}

export default Dropdown;
